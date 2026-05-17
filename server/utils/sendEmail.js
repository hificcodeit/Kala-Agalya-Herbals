const nodemailer = require("nodemailer");

/**
 * Sends an email using Gmail SMTP with App Password authentication.
 * Requires EMAIL_USER and EMAIL_PASS (App Password) in .env
 *
 * @param {Object} options
 * @param {string} options.email - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.message - Plain text fallback
 * @param {string} options.html - HTML email body
 */
const sendEmail = async (options) => {
  // Validate required env vars at call time
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email credentials not configured in environment variables");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });

  const mailOptions = {
    from: `"Kala Agalya Herbals" <${process.env.EMAIL_USER}>`,  // EMAIL_USER is the sender
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = sendEmail;
