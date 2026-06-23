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

function makeEmail({ to, from, subject, body, threadId, replyToMessageId }) {
  const boundary = 'rcn_boundary_' + Date.now();
  let raw = [
    `From: Rugby Cung Nhau <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];

  if (threadId) raw.push(`In-Reply-To: ${replyToMessageId}`);
  if (threadId) raw.push(`References: ${replyToMessageId}`);

  raw = raw.concat([
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    '',
    body,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    '',
    `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">${body.replace(/\n/g, '<br>')}</div>`,
    `--${boundary}--`,
  ]);

  return Buffer.from(raw.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, body, threadId, replyToMessageId, partenaireId } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'to, subject et body sont requis' });
  }

  try {
    const from = process.env.GMAIL_USER;
    const rawEmail = makeEmail({ to, from, subject, body, threadId, replyToMessageId });

    const sendRes = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawEmail,
        ...(threadId ? { threadId } : {}),
      },
    });

    // Sauvegarder l'email envoyé dans Supabase
    await supabase.from('emails').insert({
      gmail_id: sendRes.data.id,
      thread_id: sendRes.data.threadId,
      partenaire_id: partenaireId || null,
      de: `Rugby Cung Nhau <${from}>`,
      a: to,
      sujet: subject,
      corps: body,
      date_reception: new Date().toISOString(),
      lu: true,
      type: 'envoye',
    });

    return res.status(200).json({ success: true, messageId: sendRes.data.id });
  } catch (err) {
    console.error('Gmail send error:', err);
    return res.status(500).json({ error: err.message });
  }
}
