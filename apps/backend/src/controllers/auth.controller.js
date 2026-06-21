const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const { logSecurityEvent, logApiError } = require('../utils/securityLogger');
const { sendAccountEmail, sendVerificationOtpEmail } = require('../services/email.service');

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
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: Boolean(user.email_verified_at),
  };
};

const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');
const createSecureToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, tokenHash: hashToken(token) };
};
const createOtp = () => crypto.randomInt(100000, 1000000).toString();
const getDateAfterMinutes = (minutes) => new Date(Date.now() + minutes * 60 * 1000);
const getJwtExpiry = () => process.env.JWT_EXPIRY || '2h';
const isEmailVerificationRequired = () => process.env.REQUIRE_EMAIL_VERIFICATION !== 'false';
const getEmailVerificationExpiryMinutes = () => parseInt(process.env.EMAIL_VERIFY_EXPIRY_MINUTES || '1440', 10);
const getOtpExpiryMinutes = () => parseInt(process.env.EMAIL_OTP_EXPIRY_MINUTES || '10', 10);
const getOtpMaxAttempts = () => parseInt(process.env.EMAIL_OTP_MAX_ATTEMPTS || '5', 10);
const getFrontendUrl = () => String(process.env.FRONTEND_URL || process.env.PUBLIC_APP_URL || 'http://localhost:5173').replace(/\/$/, '');
const getBackendUrl = (req) => String(process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

const attachCookie = (res, name, value, options = buildAuthCookieOptions()) => {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${Math.floor(options.maxAge / 1000)}`,
    'Path=/',
    'HttpOnly',
    `SameSite=${options.sameSite}`,
  ];
  if (options.secure) parts.push('Secure');
  res.append('Set-Cookie', parts.join('; '));
};

const clearCookie = (res, name) => {
  const options = buildAuthCookieOptions();
  const parts = [
    `${name}=`,
    'Max-Age=0',
    'Path=/',
    'HttpOnly',
    `SameSite=${options.sameSite}`,
  ];
  if (options.secure) parts.push('Secure');
  res.append('Set-Cookie', parts.join('; '));
};

const readCookie = (cookieHeader = '', key) => String(cookieHeader)
  .split(';')
  .map((cookie) => cookie.trim())
  .find((cookie) => cookie.startsWith(`${key}=`))
  ?.slice(key.length + 1);

const attachAuthCookie = (res, token) => attachCookie(res, 'authToken', token);
const clearAuthCookie = (res) => clearCookie(res, 'authToken');

const createAuthToken = (userId) => jwt.sign({ userId }, getJwtSecret(), { expiresIn: getJwtExpiry() });

const sendVerificationOtp = async ({ email, userId, req }) => {
  const otp = createOtp();
  await userModel.storeEmailOtp(email, hashToken(otp), getDateAfterMinutes(getOtpExpiryMinutes()));
  await sendVerificationOtpEmail({ email, otp, req });
  logSecurityEvent('verification_otp_sent', req, { userId });
};

const refreshVerificationEmail = async ({ userId, email, req }) => {
  await sendVerificationOtp({ email, userId, req });
};

const createGoogleState = () => crypto.randomBytes(24).toString('hex');
const buildGoogleRedirectUri = (req) => process.env.GOOGLE_CALLBACK_URL || `${getBackendUrl(req)}/api/auth/google/callback`;

const requireGoogleConfig = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth is not configured');
  }
};

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) {
      if (isEmailVerificationRequired() && !existingUser.email_verified_at) {
        await refreshVerificationEmail({ userId: existingUser.id, email, req });
        return res.status(409).json({
          error: 'Email already registered but not verified. We sent a fresh verification code.',
          requiresEmailVerification: true,
          email,
        });
      }
      return res.status(409).json({ error: 'Email already registered' });
    }

    const saltRounds = parseInt(process.env.SALT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const { tokenHash } = createSecureToken();
    const verificationExpiresAt = getDateAfterMinutes(getEmailVerificationExpiryMinutes());
    const otp = createOtp();
    const otpHash = hashToken(otp);
    const otpExpiresAt = getDateAfterMinutes(getOtpExpiryMinutes());

    const result = await userModel.createUser(
      name,
      email,
      passwordHash,
      isEmailVerificationRequired() ? tokenHash : null,
      isEmailVerificationRequired() ? verificationExpiresAt : null,
      isEmailVerificationRequired() ? otpHash : null,
      isEmailVerificationRequired() ? otpExpiresAt : null,
    );

    if (isEmailVerificationRequired()) {
      await sendVerificationOtpEmail({ email, otp, req });
      logSecurityEvent('signup_created_verification_otp_sent', req, { userId: result.insertId });
    }

    if (!isEmailVerificationRequired()) {
      attachAuthCookie(res, createAuthToken(result.insertId));
    }

    return res.status(201).json({
      message: isEmailVerificationRequired()
        ? 'User registered successfully. Enter the verification code sent to your email before signing in.'
        : 'User registered successfully',
      userId: result.insertId,
      user: { id: result.insertId, name, email, emailVerified: false },
      authenticated: !isEmailVerificationRequired(),
      requiresEmailVerification: isEmailVerificationRequired(),
      email,
    });
  } catch (error) {
    logApiError('signup_failed', req, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await userModel.findUserByEmail(email);
    if (!user) {
      logSecurityEvent('login_failed_unknown_email', req, { email });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
      logSecurityEvent('login_blocked_locked_account', req, { userId: user.id });
      return res.status(423).json({ error: 'Account is temporarily locked. Please try again later.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await userModel.recordFailedLogin(user.id, parseInt(process.env.LOGIN_LOCK_MAX_ATTEMPTS || '5', 10), parseInt(process.env.LOGIN_LOCK_MINUTES || '15', 10));
      logSecurityEvent('login_failed_bad_password', req, { userId: user.id });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (isEmailVerificationRequired() && !user.email_verified_at) {
      await refreshVerificationEmail({ userId: user.id, email: user.email, req });
      logSecurityEvent('login_blocked_unverified_email', req, { userId: user.id });
      return res.status(403).json({
        error: 'Please verify your email before signing in. We sent a fresh verification code.',
        requiresEmailVerification: true,
        email: user.email,
      });
    }

    attachAuthCookie(res, createAuthToken(user.id));
    await userModel.recordSuccessfulLogin(user.id);
    logSecurityEvent('login_success', req, { userId: user.id });

    return res.status(200).json({ message: 'Login successful', user: sanitizeUser(user), userId: user.id, authenticated: true });
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

const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await userModel.verifyEmailOtp(email, hashToken(otp), getOtpMaxAttempts());
    if (!result.verified) {
      logSecurityEvent('email_otp_verify_failed', req, { reason: result.reason, email });
      const message = result.reason === 'expired'
        ? 'Verification code is expired. Please request a new code.'
        : result.reason === 'locked'
          ? 'Too many incorrect attempts. Please request a new code.'
          : 'Verification code is invalid.';
      return res.status(400).json({ error: message });
    }
    logSecurityEvent('email_otp_verified', req, { userId: result.userId });
    return res.status(200).json({ message: 'Email verified successfully. You can now sign in.' });
  } catch (error) {
    logApiError('email_otp_verify_error', req, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const resendVerificationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findUserByEmail(email);
    if (user && !user.email_verified_at) {
      await sendVerificationOtp({ email, userId: user.id, req });
    }
    return res.status(200).json({ message: 'If this email needs verification, a fresh code has been sent.' });
  } catch (error) {
    logApiError('email_otp_resend_failed', req, error);
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
    return res.status(200).json({ message: 'If this email exists, a password reset link has been sent.' });
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

const googleLogin = async (req, res) => {
  try {
    requireGoogleConfig();
    const state = createGoogleState();
    attachCookie(res, 'googleOAuthState', state, { ...buildAuthCookieOptions(), maxAge: 10 * 60 * 1000 });
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: buildGoogleRedirectUri(req),
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });
    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  } catch (error) {
    logApiError('google_login_start_failed', req, error);
    return res.redirect(`${getFrontendUrl()}/login?oauth=google_config_error`);
  }
};

const googleCallback = async (req, res) => {
  try {
    requireGoogleConfig();
    const { code, state } = req.query;
    const cookieState = decodeURIComponent(readCookie(req.headers.cookie, 'googleOAuthState') || '');
    clearCookie(res, 'googleOAuthState');
    if (!code || !state || state !== cookieState) {
      logSecurityEvent('google_oauth_state_invalid', req);
      return res.redirect(`${getFrontendUrl()}/login?oauth=google_failed`);
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: buildGoogleRedirectUri(req),
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenResponse.ok) throw new Error(`Google token exchange failed: ${tokenResponse.status}`);
    const tokenData = await tokenResponse.json();

    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!profileResponse.ok) throw new Error(`Google profile fetch failed: ${profileResponse.status}`);
    const profile = await profileResponse.json();
    if (!profile.email || !profile.email_verified || !profile.sub) {
      logSecurityEvent('google_oauth_unverified_email', req);
      return res.redirect(`${getFrontendUrl()}/login?oauth=google_unverified`);
    }

    let user = await userModel.findUserByGoogleId(profile.sub);
    if (!user) {
      user = await userModel.findUserByEmail(String(profile.email).toLowerCase());
      if (user) {
        await userModel.linkGoogleAccount(user.id, profile.sub);
        user = await userModel.findUserById(user.id);
      } else {
        const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), parseInt(process.env.SALT_ROUNDS || '12', 10));
        const result = await userModel.createGoogleUser({
          name: profile.name || String(profile.email).split('@')[0],
          email: String(profile.email).toLowerCase(),
          googleId: profile.sub,
          passwordHash,
        });
        user = await userModel.findUserById(result.insertId);
      }
    }

    attachAuthCookie(res, createAuthToken(user.id));
    await userModel.recordSuccessfulLogin(user.id);
    logSecurityEvent('google_login_success', req, { userId: user.id });
    return res.redirect(`${getFrontendUrl()}/dashboard?auth=google`);
  } catch (error) {
    logApiError('google_login_callback_failed', req, error);
    return res.redirect(`${getFrontendUrl()}/login?oauth=google_failed`);
  }
};

const me = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(200).json({ authenticated: false, user: null });
    }
    const user = await userModel.findUserById(req.user.userId);
    if (!user) {
      clearAuthCookie(res);
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({ user: sanitizeUser(user) });
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
  verifyEmailOtp,
  resendVerificationOtp,
  forgotPassword,
  resetPassword,
  googleLogin,
  googleCallback,
  me,
  logout,
};
