const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
  try {
    // Récupérer les gmail_id déjà en base
    const { data: existing } = await supabase.from('emails').select('gmail_id');
    const existingIds = new Set((existing || []).map(e => e.gmail_id));

    // Récupérer les partenaires pour matcher
    const { data: partenaires } = await supabase.from('partenaires').select('id, contact_email');

    async function syncFolder(folderName, type) {
      return new Promise((resolve) => {
        const imap = new Imap({
          user: 'admin@rugbycungnhau.com',
          password: process.env.GMAIL_APP_PASSWORD,
          host: 'imap.gmail.com',
          port: 993,
          tls: true,
          tlsOptions: { rejectUnauthorized: false }
        });

        const results = [];
        imap.once('ready', () => {
          imap.openBox(folderName, true, (err, box) => {
            if (err || !box || box.messages.total === 0) { imap.end(); return; }
            const total = box.messages.total;
            const start = Math.max(1, total - 49);
            const fetch = imap.seq.fetch(`${start}:*`, { bodies: '' });
            fetch.on('message', (msg) => {
              let buffer = '';
              msg.on('body', (stream) => { stream.on('data', (c) => buffer += c.toString('utf8')); });
              msg.once('end', () => results.push({ raw: buffer, type }));
            });
            fetch.once('end', () => imap.end());
          });
        });
        imap.once('end', () => resolve(results));
        imap.once('error', () => resolve([]));
        imap.connect();
      });
    }

    const [inbox, sent] = await Promise.all([
      syncFolder('INBOX', 'recu'),
      syncFolder('[Gmail]/Sent Mail', 'envoye'),
    ]);

    const allEmails = [...inbox, ...sent];
    let synced = 0;

    for (const { raw, type } of allEmails) {
      const parsed = await simpleParser(raw);
      const gmailId = parsed.messageId;
      if (!gmailId || existingIds.has(gmailId)) continue;

      const isEnvoye = type === 'envoye';
      const fromEmail = parsed.from?.value?.[0]?.address?.toLowerCase() || '';
      const toEmail = parsed.to?.value?.[0]?.address?.toLowerCase() || '';
      const matchEmail = isEnvoye ? toEmail : fromEmail;

      let partenaireId = null;
      if (partenaires) {
        const match = partenaires.find(p =>
          p.contact_email && p.contact_email.toLowerCase() === matchEmail
        );
        if (match) partenaireId = match.id;
      }

      const { error } = await supabase.from('emails').upsert({
        gmail_id: gmailId,
        thread_id: parsed.inReplyTo || gmailId,
        partenaire_id: partenaireId,
        de: parsed.from ? parsed.from.text : '',
        a: parsed.to ? parsed.to.text : '',
        sujet: parsed.subject || '(sans objet)',
        corps: (parsed.text || '').substring(0, 5000),
        date_reception: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
        lu: isEnvoye,
        type: type,
      }, { onConflict: 'gmail_id' });

      if (!error) { synced++; existingIds.add(gmailId); }
    }

    return res.status(200).json({ synced, total: allEmails.length });
  } catch (err) {
    console.error('Sync error:', err);
    return res.status(500).json({ error: err.message });
  }
};
