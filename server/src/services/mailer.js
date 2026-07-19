import nodemailer from 'nodemailer';
import { config } from '../config.js';

export function isMailConfigured() {
  return Boolean(config.mail.user && config.mail.pass && config.mail.from);
}

function createTransporter() {
  return nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: {
      user: config.mail.user,
      pass: config.mail.pass,
    },
  });
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  if (!isMailConfigured()) return false;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"LearnHub" <${config.mail.from}>`,
    to,
    subject: 'Reset your LearnHub password',
    text: [
      `Hi ${name || 'there'},`,
      '',
      'We received a request to reset your LearnHub password.',
      `Open this link to set a new password: ${resetUrl}`,
      '',
      'This link expires in 30 minutes. If you did not request this, you can ignore this email.',
      '',
      'LearnHub',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
        <h2>Reset your LearnHub password</h2>
        <p>Hi ${name || 'there'},</p>
        <p>We received a request to reset your LearnHub password.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700">
            Reset password
          </a>
        </p>
        <p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>
        <p>LearnHub</p>
      </div>
    `,
  });

  return true;
}

export async function sendContactRequestEmail({ to, name, email, subject, message, requestId }) {
  if (!isMailConfigured()) return false;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"LearnHub Contact" <${config.mail.from}>`,
    to,
    replyTo: `"${name}" <${email}>`,
    subject: `LearnHub contact: ${subject}`,
    text: [
      'New LearnHub contact request',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      `Subject: ${subject}`,
      requestId ? `Request ID: ${requestId}` : null,
      '',
      'Message:',
      message,
    ]
      .filter(Boolean)
      .join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
        <h2>New LearnHub contact request</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        ${requestId ? `<p><strong>Request ID:</strong> ${escapeHtml(requestId)}</p>` : ''}
        <hr style="border:0;border-top:1px solid #e2e8f0;margin:16px 0" />
        <p style="white-space:pre-line">${escapeHtml(message)}</p>
      </div>
    `,
  });

  return true;
}

export async function sendContactAutoReplyEmail({ to, name, subject }) {
  if (!isMailConfigured()) return false;

  const transporter = createTransporter();
  const greeting = name ? `Hi ${name},` : 'Hello,';

  const textBody = [
    greeting,
    '',
    'Thank you for contacting LearnHub.',
    '',
    'We have received your message and our support team will review your request as soon as possible. Most inquiries receive a response within 1–2 business days.',
    '',
    'If your request is related to a course purchase, please include your Order ID and registered email address for faster assistance.',
    '',
    'We appreciate your patience and thank you for learning with LearnHub.',
    '',
    `Your subject: ${subject}`,
    '',
    'LearnHub Support',
  ].join('\n');

  await transporter.sendMail({
    from: `"LearnHub Support" <${config.mail.from}>`,
    to,
    subject: 'We received your message — LearnHub Support',
    text: textBody,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:560px">
        <p>${escapeHtml(greeting)}</p>
        <p>Thank you for contacting LearnHub.</p>
        <p>We have received your message and our support team will review your request as soon as possible. Most inquiries receive a response within 1–2 business days.</p>
        <p>If your request is related to a course purchase, please include your Order ID and registered email address for faster assistance.</p>
        <p>We appreciate your patience and thank you for learning with LearnHub.</p>
        <hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0" />
        <p style="font-size:14px;color:#64748b"><strong>Your subject:</strong> ${escapeHtml(subject)}</p>
        <p style="margin-top:24px">LearnHub Support</p>
      </div>
    `,
  });

  return true;
}
