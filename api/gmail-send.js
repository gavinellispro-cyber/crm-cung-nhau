const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'admin@rugbycungnhau.com',
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, body, threadId, replyToMessageId, partenaireId } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'to, subject et body sont requis' });
  }

  try {
    const mailOptions = {
      from: 'Rugby Cung Nhau <admin@rugbycungnhau.com>',
      to: to,
      subject: subject,
      text: body,
      html: `<div style="font-family: Arial, sans-serif; font-size: 14px;">${body.replace(/\n/g, '<br>')}</div>`,
      ...(replyToMessageId ? { inReplyTo: replyToMessageId, references: replyToMessageId } : {}),
    };

    const info = await transporter.sendMail(mailOptions);

    // Sauvegarder dans Supabase
    await supabase.from('emails').insert({
      gmail_id: info.messageId,
      thread_id: threadId || info.messageId,
      partenaire_id: partenaireId || null,
      de: 'Rugby Cung Nhau <admin@rugbycungnhau.com>',
      a: to,
      sujet: subject,
      corps: body,
      date_reception: new Date().toISOString(),
      lu: true,
      type: 'envoye',
    });

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error('Send error:', err);
    return res.status(500).json({ error: err.message });
  }
};
