const nodemailer = require('nodemailer');

/**
 * Converts a plain Cloudinary raw URL into a download URL with the student's name as filename.
 * Inserts fl_attachment:{sanitized_name} into the URL so the browser downloads
 * the file as "StudentName.pdf" instead of the raw Cloudinary public_id.
 */
const getDownloadUrl = (url, studentName) => {
  if (!url) return url;
  // NOTE: Do NOT include a file extension in the fl_attachment name.
  // Cloudinary treats the extension as a format conversion on raw resources → 400.
  const safe = (studentName || 'Result')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '');
  return url.replace('/upload/', `/upload/fl_attachment:${safe}/`);
};

// Brevo SMTP transporter
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.BREVO_SMTP_USER,   // your Brevo login email
    pass: process.env.BREVO_SMTP_KEY,    // SMTP key from Brevo dashboard
  },
});

const EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px; color: #333; }
    .container { max-width: 600px; margin: auto; background: #fff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #1a73e8; color: white; padding: 20px; border-radius: 6px 6px 0 0; text-align: center; }
    .body { padding: 20px 0; }
    .btn { display: inline-block; padding: 12px 24px; background: #1a73e8; color: #fff !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 16px; }
    .footer { font-size: 12px; color: #999; text-align: center; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>📄 Your Child's Result</h2>
    </div>
    <div class="body">
      <p>Dear Parent/Guardian,</p>
      <p>We are pleased to share the academic result for <strong>{{student_name}}</strong> in <strong>{{class}}</strong>.</p>
      <p>Please click the button below to view and download the result:</p>
      <a href="{{result_link}}" class="btn">View Result</a>
      <p style="margin-top:16px; font-size:13px; color:#666;">If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="{{result_link}}">{{result_link}}</a>
      </p>
    </div>
    <div class="footer">
      <p>This email was sent by your school's administration. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Sends a result email to a single parent via Brevo SMTP.
 * @param {Object} params - { studentName, className, parentEmail, resultLink, template? }
 */
const sendResultEmail = async ({ studentName, className, parentEmail, resultLink, template }) => {
  const tmpl = template || EMAIL_TEMPLATE;
  const html = tmpl
    .replace(/{{student_name}}/g, studentName)
    .replace(/{{class}}/g, className)
    .replace(/{{result_link}}/g, resultLink);

  const text = `Dear Parent/Guardian,\n\nThe result for ${studentName} (${className}) is available at:\n${resultLink}\n\nPlease do not reply to this email.`;

  await transporter.sendMail({
    from: `"School Result System" <${process.env.BREVO_FROM_EMAIL}>`,
    to: parentEmail,
    subject: `Academic Result for ${studentName}`,
    text,
    html,
  });
};

/**
 * Verify SMTP connection — call at startup to catch config issues early.
 */
const verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log('[Email] SMTP connection verified OK');
  } catch (err) {
    console.error('[Email] SMTP connection FAILED:', err.message);
    console.error('[Email] Check BREVO_SMTP_USER, BREVO_SMTP_KEY, and BREVO_FROM_EMAIL in .env');
  }
};

module.exports = { sendResultEmail, verifyTransporter, getDownloadUrl, EMAIL_TEMPLATE };
