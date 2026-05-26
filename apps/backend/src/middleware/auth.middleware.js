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

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  const cookieToken = readCookie(req.headers.cookie, 'authToken');

  if (!authHeader && !cookieToken) {
    return null;
  }

  return authHeader
    ? (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader)
    : cookieToken;
};

const verifyToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ['HS256'],
  });

const authMiddleware = (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'JWT is not configured' });
    }

    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const decoded = verifyToken(token);
    req.user = { userId: decoded.userId };
    return next();
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

const optionalAuthMiddleware = (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      req.user = null;
      return next();
    }

    const token = getTokenFromRequest(req);
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = verifyToken(token);
    req.user = { userId: decoded.userId };
    return next();
  } catch (error) {
    req.user = null;
    return next();
  }
};

module.exports = authMiddleware;
module.exports.optionalAuthMiddleware = optionalAuthMiddleware;
