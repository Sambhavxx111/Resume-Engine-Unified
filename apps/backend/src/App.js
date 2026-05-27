const express = require('express');
const cors = require('cors');
const { generalApiLimiter } = require('./middleware/rateLimit.middleware');
const csrfProtection = require('./middleware/csrf.middleware');
const { logApiError, logSecurityEvent } = require('./utils/securityLogger');

// Import route files
const authRoutes = require('./routes/auth.routes');
const resumeRoutes = require('./routes/resume.routes');
const atsRoutes = require('./routes/ats.routes');
const aiRoutes = require('./routes/ai.routes');

// Initialize Express app
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
const configuredOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(:\d+)?$/i;

// Middleware
app.use((req, res, next) => {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ENFORCE_HTTPS !== 'false' &&
    req.headers['x-forwarded-proto'] &&
    req.headers['x-forwarded-proto'] !== 'https'
  ) {
    logSecurityEvent('blocked_insecure_http', req);
    return res.status(403).json({ error: 'HTTPS is required' });
  }

  return next();
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (configuredOrigins.includes(origin) || localOriginPattern.test(origin)) {
      return callback(null, true);
    }

    const corsError = new Error('CORS origin not allowed');
    corsError.status = 403;
    corsError.expose = true;
    return callback(corsError);
  },
  credentials: true,
}));
app.use('/api', generalApiLimiter);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }));
app.use((error, req, res, next) => {
  if (error?.type === 'entity.too.large') {
    logSecurityEvent('blocked_large_json_body', req, { limit: process.env.JSON_BODY_LIMIT || '1mb' });
    return res.status(413).json({ error: 'Request body is too large.' });
  }

  return next(error);
});
app.use(csrfProtection);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/ats', atsRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use((req, res) => {
  logSecurityEvent('route_not_found', req);
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error handler (use separate middleware for testing and clarity)
const errorHandler = require('./middleware/error.middleware');
app.use((error, req, res, next) => {
  logApiError('unhandled_api_error', req, error);
  next(error);
});
app.use(errorHandler);

module.exports = app;
