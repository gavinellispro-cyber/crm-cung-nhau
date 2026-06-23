const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

function decodeBase64(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

function getHeader(headers, name) {
  const h = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return h ? h.value : '';
}

function extractBody(payload) {
  if (!payload) return '';
  if (payload.body && payload.body.data) return decodeBase64(payload.body.data);
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        return decodeBase64(part.body.data);
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body && part.body.data) {
        return decodeBase64(part.body.data).replace(/<[^>]+>/g, ' ').trim();
      }
    }
  }
  return '';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Récupérer les emails des dernières 24h non encore synchronisés
    const after = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: `after:${after}`,
      maxResults: 50,
    });

    const messages = listRes.data.messages || [];
    if (messages.length === 0) return res.status(200).json({ synced: 0 });

    // Récupérer les gmail_id déjà en base pour éviter les doublons
    const { data: existing } = await supabase
      .from('emails')
      .select('gmail_id');
    const existingIds = new Set((existing || []).map(e => e.gmail_id));

    // Récupérer les partenaires pour matcher par email
    const { data: partenaires } = await supabase
      .from('partenaires')
      .select('id, nom, contact_email');

    let synced = 0;
    for (const msg of messages) {
      if (existingIds.has(msg.id)) continue;

      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      });

      const headers = detail.data.payload.headers;
      const from = getHeader(headers, 'From');
      const to = getHeader(headers, 'To');
      const subject = getHeader(headers, 'Subject');
      const date = getHeader(headers, 'Date');
      const body = extractBody(detail.data.payload);
      const threadId = detail.data.threadId;

      // Extraire l'adresse email brute de "Nom <email>"
      const fromEmail = (from.match(/<(.+?)>/) || [null, from])[1].trim().toLowerCase();

      // Chercher un partenaire correspondant
      let partenaireId = null;
      if (partenaires) {
        const match = partenaires.find(p =>
          p.contact_email && p.contact_email.toLowerCase() === fromEmail
        );
        if (match) partenaireId = match.id;
      }

      await supabase.from('emails').insert({
        gmail_id: msg.id,
        thread_id: threadId,
        partenaire_id: partenaireId,
        de: from,
        a: to,
        sujet: subject,
        corps: body,
        date_reception: date ? new Date(date).toISOString() : new Date().toISOString(),
        lu: false,
        type: 'recu',
      });
      synced++;
    }

    return res.status(200).json({ synced, total: messages.length });
  } catch (err) {
    console.error('Gmail sync error:', err);
    return res.status(500).json({ error: err.message });
  }
}
