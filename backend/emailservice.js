// ============================================================
//  ZENSUTRA — Email Service
//  File: Backend/Controllers/utils/emailService.js
//  ────────────────────────────────────────────────────────────
//  Thin wrapper around Nodemailer.
//  In development with USE_TEST_EMAIL=true it uses Ethereal
//  (fake SMTP) so no real emails are sent.
//  In production it uses the configured Gmail / SMTP service.
//
//  Returns: { success: true, messageId } | { success: false, error }
// ============================================================

const nodemailer = require('nodemailer');

async function sendEmail ({ to, subject, text, html }) {
  try {
    let transporter;
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev && process.env.USE_TEST_EMAIL === 'true') {
      // Ethereal test account (no real email sent)
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email', port: 587, secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    } else {
      transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        host:    process.env.EMAIL_HOST,
        port:    parseInt(process.env.EMAIL_PORT) || 587,
        secure:  process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }

    const info = await transporter.sendMail({
      from:    process.env.EMAIL_FROM || 'Zensutra <noreply@zensutra.app>',
      to, subject, text, html,
    });

    if (isDev) console.log('📧  Email sent. Preview:', nodemailer.getTestMessageUrl(info));

    return { success: true, messageId: info.messageId };

  } catch (err) {
    console.error('Email send failed:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = sendEmail;