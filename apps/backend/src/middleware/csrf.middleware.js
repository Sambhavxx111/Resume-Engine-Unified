const { logSecurityEvent } = require('../utils/securityLogger');

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const parseOrigins = () =>
  (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(:\d+)?$/i;
const getAllowedOrigins = () => {
  const configuredOrigins = parseOrigins();
  if (process.env.NODE_ENV !== 'production') {
    return configuredOrigins;
  }

  return configuredOrigins.length
    ? configuredOrigins
    : [
        'https://resume-engine-unified-virid.vercel.app',
        'https://resume-engine-unified.vercel.app',
      ];
};

const hasAuthCookie = (cookieHeader = '') =>
  String(cookieHeader)
    .split(';')
    .map((part) => part.trim())
    .some((part) => part.startsWith('authToken='));

const originFromReferer = (referer = '') => {
  try {
    return referer ? new URL(referer).origin : '';
  } catch {
    return '';
  }
};

const isAllowedOrigin = (origin) => {
  if (!origin) return false;
  return getAllowedOrigins().includes(origin) || (process.env.NODE_ENV !== 'production' && localOriginPattern.test(origin));
};

const csrfProtection = (req, res, next) => {
  if (!unsafeMethods.has(req.method)) {
    return next();
  }

  if (!hasAuthCookie(req.headers.cookie)) {
    return next();
  }

  const origin = req.headers.origin || originFromReferer(req.headers.referer);
  if (isAllowedOrigin(origin)) {
    return next();
  }

  logSecurityEvent('csrf_origin_blocked', req, {
    origin: origin || 'missing',
    path: req.originalUrl,
  });
  return res.status(403).json({ error: 'Invalid request origin' });
};

module.exports = csrfProtection;
