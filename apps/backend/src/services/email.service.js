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

const sendAccountEmail = async ({ type, email, token, req }) => {
  const url = buildAccountUrl(type, token);
  const content = buildEmailContent(type, url);
  const provider = getProvider();

  if (!provider) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`${type === 'verify' ? 'Email verification' : 'Password reset'} link for local development: ${url}`);
      return { delivered: false, provider: 'console', url };
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
      return { delivered: true, provider, url };
    }

    throw new Error(`Unsupported EMAIL_PROVIDER: ${provider}`);
  } catch (error) {
    if (req) {
      logApiError('email_send_failed', req, error);
    }
    throw error;
  }
};

module.exports = {
  sendAccountEmail,
  buildAccountUrl,
};
