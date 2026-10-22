const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Initializes and returns the Nodemailer transporter.
 * In development, creates an Ethereal test account if custom SMTP credentials are not provided.
 */
const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('📧 Custom SMTP Transporter initialized');
  } else {
    // Development fallback: Ethereal Fake SMTP
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Ethereal Test SMTP initialized (Development Mode)');
    console.log(`   User: ${testAccount.user}`);
  }

  return transporter;
};

/**
 * Helper function to send an email and log the preview URL in dev mode
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailTransporter = await getTransporter();
    const info = await mailTransporter.sendMail({
      from: '"Placement Cell" <placements@campus.edu>',
      to,
      subject,
      text,
      html,
    });

    console.log(`✅ Email sent to [${to}] - Message ID: ${info.messageId}`);
    
    // In development mode with Ethereal, log preview link
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`🔗 Preview Sent Email at: ${previewUrl}`);
    }

    return info;
  } catch (error) {
    console.error(`❌ Error sending email to [${to}]:`, error);
    throw error;
  }
};

module.exports = { sendEmail };
