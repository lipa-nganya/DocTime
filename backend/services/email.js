const nodemailer = require('nodemailer');

/**
 * Create email transporter
 */
function createTransporter() {
  const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com';
  const smtpPort = process.env.SMTP_PORT || process.env.EMAIL_PORT || 587;
  const smtpSecure = process.env.SMTP_SECURE === 'true';
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || process.env.EMAIL_FROM || smtpUser;

  if (!smtpHost || !smtpPort) {
    console.warn('⚠️  SMTP configuration not found. Email sending will be disabled.');
    return null;
  }

  if (!smtpUser || !smtpPass) {
    console.warn('⚠️  SMTP credentials not configured. Email sending will be disabled.');
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: Number(smtpPort),
    secure: smtpSecure || Number(smtpPort) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
}

/**
 * Send email
 */
async function sendEmail(to, subject, html, text) {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.warn('⚠️  Email transporter not configured. Email not sent.');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const smtpFrom = process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER;
    
    const info = await transporter.sendMail({
      from: `"Doc Time" <${smtpFrom}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html
    });

    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendEmail,
  createTransporter
};

