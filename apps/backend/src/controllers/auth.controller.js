const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const { logSecurityEvent, logApiError } = require('../utils/securityLogger');
const { sendAccountEmail } = require('../services/email.service');

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
    emailVerified: Boolean(user.email_verified_at),
  };
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const createSecureToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, tokenHash: hashToken(token) };
};

const getDateAfterMinutes = (minutes) => new Date(Date.now() + minutes * 60 * 1000);

const getJwtExpiry = () => process.env.JWT_EXPIRY || '2h';

const isEmailVerificationRequired = () => process.env.REQUIRE_EMAIL_VERIFICATION !== 'false';
const getEmailVerificationExpiryMinutes = () =>
  parseInt(process.env.EMAIL_VERIFY_EXPIRY_MINUTES || '1440', 10);

const refreshVerificationEmail = async ({ userId, email, req }) => {
  const { token, tokenHash } = createSecureToken();
  const verificationExpiresAt = getDateAfterMinutes(getEmailVerificationExpiryMinutes());
  await userModel.storeEmailVerificationToken(email, tokenHash, verificationExpiresAt);
  await sendAccountEmail({ type: 'verify', email, token, req });
  logSecurityEvent('verification_email_resent', req, { userId });
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
      if (isEmailVerificationRequired() && !existingUser.email_verified_at) {
        await refreshVerificationEmail({ userId: existingUser.id, email, req });
        return res.status(409).json({
          error: 'Email already registered but not verified. We sent a fresh verification email.',
        });
      }
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password using configurable salt rounds
    const saltRounds = parseInt(process.env.SALT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const { token, tokenHash } = createSecureToken();
    const verificationExpiresAt = getDateAfterMinutes(getEmailVerificationExpiryMinutes());

    // Create user
    const result = await userModel.createUser(name, email, passwordHash, tokenHash, verificationExpiresAt);
    await sendAccountEmail({ type: 'verify', email, token, req });
    logSecurityEvent('signup_created', req, { userId: result.insertId });

    if (!isEmailVerificationRequired()) {
      const authToken = jwt.sign(
        { userId: result.insertId },
        getJwtSecret(),
        { expiresIn: getJwtExpiry() }
      );
      attachAuthCookie(res, authToken);
    }

    return res.status(201).json({
      message: isEmailVerificationRequired()
        ? 'User registered successfully. Please verify your email before signing in.'
        : 'User registered successfully',
      userId: result.insertId,
      user: {
        id: result.insertId,
        name,
        email,
        emailVerified: false,
      },
      authenticated: !isEmailVerificationRequired(),
    });
  } catch (error) {
    logApiError('signup_failed', req, error);
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
      logSecurityEvent('login_failed_unknown_email', req, { email });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
      logSecurityEvent('login_blocked_locked_account', req, { userId: user.id });
      return res.status(423).json({ error: 'Account is temporarily locked. Please try again later.' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await userModel.recordFailedLogin(
        user.id,
        parseInt(process.env.LOGIN_LOCK_MAX_ATTEMPTS || '5', 10),
        parseInt(process.env.LOGIN_LOCK_MINUTES || '15', 10),
      );
      logSecurityEvent('login_failed_bad_password', req, { userId: user.id });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (isEmailVerificationRequired() && !user.email_verified_at) {
      await refreshVerificationEmail({ userId: user.id, email: user.email, req });
      logSecurityEvent('login_blocked_unverified_email', req, { userId: user.id });
      return res.status(403).json({ error: 'Please verify your email before signing in. We sent a fresh verification email.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      getJwtSecret(),
      { expiresIn: getJwtExpiry() }
    );
    attachAuthCookie(res, token);
    await userModel.recordSuccessfulLogin(user.id);
    logSecurityEvent('login_success', req, { userId: user.id });

    return res.status(200).json({
      message: 'Login successful',
      user: sanitizeUser(user),
      userId: user.id,
      authenticated: true,
    });
  } catch (error) {
    logApiError('login_failed', req, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const result = await userModel.markEmailVerified(hashToken(req.body.token));
    if (!result.affectedRows) {
      logSecurityEvent('email_verify_failed', req);
      return res.status(400).json({ error: 'Verification link is invalid or expired.' });
    }

    logSecurityEvent('email_verified', req);
    return res.status(200).json({ message: 'Email verified successfully. You can now sign in.' });
  } catch (error) {
    logApiError('email_verify_error', req, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findUserByEmail(email);

    if (user) {
      const { token, tokenHash } = createSecureToken();
      const expiresAt = getDateAfterMinutes(parseInt(process.env.PASSWORD_RESET_EXPIRY_MINUTES || '30', 10));
      await userModel.storePasswordResetToken(email, tokenHash, expiresAt);
      await sendAccountEmail({ type: 'reset', email, token, req });
      logSecurityEvent('password_reset_requested', req, { userId: user.id });
    } else {
      logSecurityEvent('password_reset_requested_unknown_email', req, { email });
    }

    return res.status(200).json({
      message: 'If this email exists, a password reset link has been sent.',
    });
  } catch (error) {
    logApiError('password_reset_request_failed', req, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const saltRounds = parseInt(process.env.SALT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(req.body.password, saltRounds);
    const result = await userModel.resetPasswordByToken(hashToken(req.body.token), passwordHash);

    if (!result.affectedRows) {
      logSecurityEvent('password_reset_failed', req);
      return res.status(400).json({ error: 'Password reset link is invalid or expired.' });
    }

    clearAuthCookie(res);
    logSecurityEvent('password_reset_success', req);
    return res.status(200).json({ message: 'Password reset successfully. Please sign in again.' });
  } catch (error) {
    logApiError('password_reset_failed', req, error);
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
  verifyEmail,
  forgotPassword,
  resetPassword,
  me,
  logout,
};

