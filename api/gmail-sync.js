const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function fetchEmails(folder, maxEmails) {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: 'admin@rugbycungnhau.com',
      password: process.env.GMAIL_APP_PASSWORD,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    const emails = [];

    imap.once('ready', () => {
      imap.openBox(folder, true, (err, box) => {
        if (err) { imap.end(); return reject(err); }

        const total = box.messages.total;
        if (total === 0) { imap.end(); return resolve([]); }

        const start = Math.max(1, total - maxEmails + 1);
        const fetch = imap.seq.fetch(`${start}:*`, { bodies: '' });

        fetch.on('message', (msg) => {
          let buffer = '';
          msg.on('body', (stream) => {
            stream.on('data', (chunk) => buffer += chunk.toString('utf8'));
          });
          msg.once('end', () => emails.push(buffer));
        });

        fetch.once('error', reject);
        fetch.once('end', () => { imap.end(); });
      });
    });

    imap.once('end', () => resolve(emails));
    imap.once('error', reject);
    imap.connect();
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Récupérer les emails existants pour éviter doublons
    const { data: existing } = await supabase.from('emails').select('gmail_id');
    const existingIds = new Set((existing || []).map(e => e.gmail_id));

    // Récupérer les partenaires
    const { data: partenaires } = await supabase.from('partenaires').select('id, nom, contact_email');

    // Fetch INBOX et SENT
    const [inboxRaw, sentRaw] = await Promise.all([
      fetchEmails('INBOX', 50),
      fetchEmails('[Gmail]/Sent Mail', 50),
    ]);

    let synced = 0;

    async function processEmails(rawEmails, type) {
      for (const raw of rawEmails) {
        const parsed = await simpleParser(raw);
        const gmailId = parsed.messageId || raw.substring(0, 100);

        if (existingIds.has(gmailId)) continue;

        const from = parsed.from ? parsed.from.text : '';
        const to = parsed.to ? parsed.to.text : '';
        const subject = parsed.subject || '';
        const body = parsed.text || parsed.html?.replace(/<[^>]+>/g, ' ') || '';
        const date = parsed.date ? parsed.date.toISOString() : new Date().toISOString();
        const isEnvoye = type === 'envoye';

        // Matcher partenaire
        let partenaireId = null;
        if (partenaires) {
          const fromEmail = parsed.from?.value?.[0]?.address?.toLowerCase() || '';
          const toEmail = parsed.to?.value?.[0]?.address?.toLowerCase() || '';
          const matchEmail = isEnvoye ? toEmail : fromEmail;
          const match = partenaires.find(p =>
            p.contact_email && p.contact_email.toLowerCase() === matchEmail
          );
          if (match) partenaireId = match.id;
        }

        await supabase.from('emails').insert({
          gmail_id: gmailId,
          thread_id: parsed.inReplyTo || gmailId,
          partenaire_id: partenaireId,
          de: from,
          a: to,
          sujet: subject,
          corps: body.substring(0, 5000),
          date_reception: date,
          lu: isEnvoye,
          type: type,
        });

        existingIds.add(gmailId);
        synced++;
      }
    }

    await processEmails(inboxRaw, 'recu');
    await processEmails(sentRaw, 'envoye');

    return res.status(200).json({ synced });
  } catch (err) {
    console.error('Sync error:', err);
    return res.status(500).json({ error: err.message });
  }
};
