const jwt = require('jsonwebtoken');

const readCookie = (cookieHeader = '', key) => {
  const cookies = String(cookieHeader)
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);

  const match = cookies.find((cookie) => cookie.startsWith(`${key}=`));
  if (!match) {
    return null;
  }

  return decodeURIComponent(match.slice(key.length + 1));
};

const authMiddleware = (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'JWT is not configured' });
    }

    // Read Authorization header
    const authHeader = req.headers.authorization;
    const cookieToken = readCookie(req.headers.cookie, 'authToken');

    if (!authHeader && !cookieToken) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    // Extract Bearer token
    const token = authHeader
      ? (authHeader.startsWith('Bearer ')
          ? authHeader.slice(7)
          : authHeader)
      : cookieToken;

    if (!token) {
      return res.status(401).json({ error: 'Missing token' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach userId to request
    req.user = { userId: decoded.userId };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = authMiddleware;
