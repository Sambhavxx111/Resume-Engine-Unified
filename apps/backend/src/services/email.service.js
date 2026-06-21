const { logApiError } = require('../utils/securityLogger');

const getPublicAppUrl = () =>
  String(process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

const getProvider = () => String(process.env.EMAIL_PROVIDER || '').trim().toLowerCase();

const getEmailFrom = () => {
  const from = String(process.env.EMAIL_FROM || '').trim();
  if (!from) {
    throw new Error('EMAIL_FROM is missing');
  }
  return from;
};

const buildAccountUrl = (type, token) => {
  const route = type === 'verify' ? '/verify-email' : '/reset-password';
  return `${getPublicAppUrl()}${route}?token=${encodeURIComponent(token)}`;
};

const buildOtpEmailContent = (otp) => ({
  subject: 'Your Resume Engine verification code',
  html: `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <h2 style="margin-bottom:12px">Verify your email</h2>
      <p>Your Resume Engine verification code is:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:8px;margin:20px 0;color:#0f172a">${otp}</p>
      <p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>
    </div>
  `,
  text: `Your Resume Engine verification code is ${otp}. This code expires in 10 minutes.`,
});

const buildEmailContent = (type, url) => {
  if (type === 'verify') {
    return {
      subject: 'Verify your Resume Engine account',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
          <h2 style="margin-bottom:12px">Verify your email</h2>
          <p>Welcome to Resume Engine. Confirm your email address to activate your account.</p>
          <p style="margin:24px 0">
            <a href="${url}" style="background:#0f172a;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Verify email</a>
          </p>
          <p>If the button does not work, open this link:</p>
          <p><a href="${url}">${url}</a></p>
          <p>This link expires automatically.</p>
        </div>
      `,
      text: `Verify your Resume Engine account by opening this link: ${url}`,
    };
  }

  return {
    subject: 'Reset your Resume Engine password',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="margin-bottom:12px">Reset your password</h2>
        <p>We received a request to reset your Resume Engine password.</p>
        <p style="margin:24px 0">
          <a href="${url}" style="background:#0f172a;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Reset password</a>
        </p>
        <p>If the button does not work, open this link:</p>
        <p><a href="${url}">${url}</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
    text: `Reset your Resume Engine password by opening this link: ${url}`,
  };
};

const sendWithResend = async ({ to, subject, html, text }) => {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is missing');
  }

  const payload = {
    from: getEmailFrom(),
    to: [to],
    subject,
    html,
    text,
  };

  const replyTo = String(process.env.EMAIL_REPLY_TO || '').trim();
  if (replyTo) {
    payload.reply_to = replyTo;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const textBody = await response.text();
    throw new Error(`Resend email send failed with status ${response.status}: ${textBody}`);
  }
};

const sendGeneratedEmail = async ({ email, content, req, eventName }) => {
  const provider = getProvider();

  if (!provider) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`${content.subject}: ${content.text}`);
      return { delivered: false, provider: 'console' };
    }
    throw new Error('EMAIL_PROVIDER is missing');
  }

  try {
    if (provider === 'resend') {
      await sendWithResend({
        to: email,
        subject: content.subject,
        html: content.html,
        text: content.text,
      });
      return { delivered: true, provider };
    }

    throw new Error(`Unsupported EMAIL_PROVIDER: ${provider}`);
  } catch (error) {
    if (req) {
      logApiError(eventName, req, error);
    }
    throw error;
  }
};

const sendAccountEmail = async ({ type, email, token, req }) => {
  const url = buildAccountUrl(type, token);
  const content = buildEmailContent(type, url);
  const result = await sendGeneratedEmail({ email, content, req, eventName: 'email_send_failed' });
  return { ...result, url };
};

const sendVerificationOtpEmail = async ({ email, otp, req }) => {
  const content = buildOtpEmailContent(otp);
  return sendGeneratedEmail({ email, content, req, eventName: 'email_otp_send_failed' });
};

module.exports = {
  sendAccountEmail,
  sendVerificationOtpEmail,
  buildAccountUrl,
};
