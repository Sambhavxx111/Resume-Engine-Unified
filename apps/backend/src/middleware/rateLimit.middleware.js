const rateLimit = require('express-rate-limit');
const { logSecurityEvent } = require('../utils/securityLogger');

const parseLimit = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildLimiter = ({ windowMs, max, message, keyPrefix }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
    handler: (req, res, next, options) => {
      logSecurityEvent('rate_limit_exceeded', req, { keyPrefix, limit: options.limit });
      res.status(options.statusCode).json(options.message);
    },
  });

const generalApiLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: parseLimit(process.env.API_RATE_LIMIT_MAX, 300),
  message: 'Too many requests. Please slow down and try again later.',
  keyPrefix: 'api',
});

const authLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: parseLimit(process.env.AUTH_RATE_LIMIT_MAX, 8),
  message: 'Too many authentication attempts. Please try again later.',
  keyPrefix: 'auth',
});

const signupLimiter = buildLimiter({
  windowMs: 60 * 60 * 1000,
  max: parseLimit(process.env.SIGNUP_RATE_LIMIT_MAX, 5),
  message: 'Too many account creation attempts. Please try again later.',
  keyPrefix: 'signup',
});

const aiLimiter = buildLimiter({
  windowMs: 60 * 1000,
  max: parseLimit(process.env.AI_RATE_LIMIT_MAX, 10),
  message: 'Too many requests to AI endpoints. Please try again later.',
  keyPrefix: 'ai',
});

const uploadLimiter = buildLimiter({
  windowMs: 10 * 60 * 1000,
  max: parseLimit(process.env.UPLOAD_RATE_LIMIT_MAX, 20),
  message: 'Too many upload requests. Please try again later.',
  keyPrefix: 'upload',
});

module.exports = {
  generalApiLimiter,
  authLimiter,
  signupLimiter,
  aiLimiter,
  uploadLimiter,
};
