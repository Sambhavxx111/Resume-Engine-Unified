const redact = (value = '') =>
  String(value || '')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\b(?:Bearer\s+)?[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b/g, '[jwt]')
    .replace(/\b\d{8,}\b/g, '[number]');

const getRequestMeta = (req) => ({
  ip: req.ip || req.socket?.remoteAddress || 'unknown',
  method: req.method,
  path: req.originalUrl || req.url,
  userId: req.user?.userId || null,
  userAgent: req.headers['user-agent'] || '',
});

const logSecurityEvent = (event, req, details = {}) => {
  const safeDetails = Object.fromEntries(
    Object.entries(details).map(([key, value]) => [key, typeof value === 'string' ? redact(value) : value]),
  );

  console.warn(JSON.stringify({
    level: 'warn',
    type: 'security',
    event,
    at: new Date().toISOString(),
    ...getRequestMeta(req),
    details: safeDetails,
  }));
};

const logApiError = (event, req, error) => {
  console.error(JSON.stringify({
    level: 'error',
    type: 'api',
    event,
    at: new Date().toISOString(),
    ...getRequestMeta(req),
    message: redact(error?.message || 'Unexpected API error'),
  }));
};

module.exports = {
  logSecurityEvent,
  logApiError,
  redact,
};
