const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
  try {
    const imap = new Imap({
      user: 'admin@rugbycungnhau.com',
      password: process.env.GMAIL_APP_PASSWORD,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    const emails = await new Promise((resolve, reject) => {
      const results = [];
      imap.once('ready', () => {
        imap.openBox('INBOX', true, (err, box) => {
          if (err) { imap.end(); return reject(err); }
          const total = box.messages.total;
          if (total === 0) { imap.end(); return resolve([]); }
          const start = Math.max(1, total - 10 + 1);
          const fetch = imap.seq.fetch(`${start}:*`, { bodies: '' });
          fetch.on('message', (msg) => {
            let buffer = '';
            msg.on('body', (stream) => {
              stream.on('data', (chunk) => buffer += chunk.toString('utf8'));
            });
            msg.once('end', () => results.push(buffer));
          });
          fetch.once('end', () => imap.end());
        });
      });
      imap.once('end', () => resolve(results));
      imap.once('error', reject);
      imap.connect();
    });

    let synced = 0;
    for (const raw of emails) {
      const parsed = await simpleParser(raw);
      const { error } = await supabase.from('emails').upsert({
        gmail_id: parsed.messageId || ('id_' + Date.now() + '_' + Math.random()),
        thread_id: parsed.inReplyTo || parsed.messageId || 'no_thread',
        partenaire_id: null,
        de: parsed.from ? parsed.from.text : '',
        a: parsed.to ? parsed.to.text : '',
        sujet: parsed.subject || '(sans objet)',
        corps: (parsed.text || '').substring(0, 5000),
        date_reception: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
        lu: false,
        type: 'recu',
      }, { onConflict: 'gmail_id' });
      if (!error) synced++;
      else console.error('Insert error:', error);
    }

    return res.status(200).json({ synced, total: emails.length });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message });
  }
};
