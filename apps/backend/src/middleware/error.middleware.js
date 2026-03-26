// Centralized error handler
function errorHandler(err, req, res, next) {
  // Default to 500
  const status = err.status || 500;
  const safeMessage = err.expose ? err.message : 'Internal server error';

  // Log server errors with stack for debugging
  if (status >= 500) {
    console.error('Unhandled error:', err.stack || err);
  } else if (process.env.NODE_ENV !== 'production') {
    console.warn('Handled error:', err.message);
  }

  res.status(status).json({ error: safeMessage });
}

module.exports = errorHandler;
