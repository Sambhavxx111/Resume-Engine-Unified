const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing');
  }

  return process.env.JWT_SECRET;
};

const buildAuthCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite = isProduction ? 'None' : 'Lax';
  const maxAge = parseInt(process.env.AUTH_COOKIE_MAX_AGE_MS || `${7 * 24 * 60 * 60 * 1000}`, 10);

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    path: '/',
    maxAge: Number.isFinite(maxAge) ? maxAge : 7 * 24 * 60 * 60 * 1000,
  };
};

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
};

const attachAuthCookie = (res, token) => {
  const options = buildAuthCookieOptions();
  const parts = [
    `authToken=${encodeURIComponent(token)}`,
    `Max-Age=${Math.floor(options.maxAge / 1000)}`,
    'Path=/',
    'HttpOnly',
    `SameSite=${options.sameSite}`,
  ];

  if (options.secure) {
    parts.push('Secure');
  }

  res.setHeader('Set-Cookie', parts.join('; '));
};

const clearAuthCookie = (res) => {
  const options = buildAuthCookieOptions();
  const parts = [
    'authToken=',
    'Max-Age=0',
    'Path=/',
    'HttpOnly',
    `SameSite=${options.sameSite}`,
  ];

  if (options.secure) {
    parts.push('Secure');
  }

  res.setHeader('Set-Cookie', parts.join('; '));
};

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password using configurable salt rounds
    const saltRounds = parseInt(process.env.SALT_ROUNDS || '10', 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await userModel.createUser(name, email, passwordHash);

    // Generate JWT token for auto-login after signup
    const token = jwt.sign(
      { userId: result.insertId },
      getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );
    attachAuthCookie(res, token);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      userId: result.insertId,
      user: {
        id: result.insertId,
        name,
        email,
      }
    });
  } catch (error) {
    console.error('Signup error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await userModel.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );
    attachAuthCookie(res, token);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: sanitizeUser(user),
      userId: user.id,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const me = async (req, res) => {
  try {
    const user = await userModel.findUserById(req.user.userId);

    if (!user) {
      clearAuthCookie(res);
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Get current user error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const logout = async (req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({ message: 'Logout successful' });
};

module.exports = {
  signup,
  login,
  me,
  logout,
};

