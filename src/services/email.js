// /src/services/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: !!(process.env.SMTP_SECURE === 'true'),
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  } : undefined
});

async function sendEmail({ to, subject, html, text }) {
  if (!to) throw new Error('email "to" is required');
  const from = process.env.FROM_EMAIL || 'no-reply@jobsportal.local';
  const info = await transporter.sendMail({ from, to, subject, text, html });
  return info.messageId;
}

// Convenience templates
function applicationReceivedTemplate({ employerName, candidateName, jobTitle }) {
  return {
    subject: `New applicant: ${candidateName} — ${jobTitle}`,
    html: `<p>Hi ${employerName},</p>
           <p><b>${candidateName}</b> just applied for <b>${jobTitle}</b>.</p>
           <p>Login to view resume and shortlist.</p>`
  };
}
function statusChangedTemplate({ candidateName, jobTitle, status }) {
  return {
    subject: `Your application for ${jobTitle} is ${status}`,
    html: `<p>Hi ${candidateName},</p>
           <p>Your application status for <b>${jobTitle}</b> is now: <b>${status}</b>.</p>`
  };
}

module.exports = { sendEmail, applicationReceivedTemplate, statusChangedTemplate };