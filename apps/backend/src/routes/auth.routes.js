const express = require('express');
const authController = require('../controllers/auth.controller');
const { optionalAuthMiddleware } = require('../middleware/auth.middleware');
const { validateBody } = require('../middleware/validate.middleware');
const {
  signupSchema,
  loginSchema,
  verifyEmailSchema,
  verifyEmailOtpSchema,
  resendVerificationOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validators/auth.validator');
const { authLimiter, signupLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

// POST /auth/signup - Register new user
router.post('/signup', signupLimiter, validateBody(signupSchema), authController.signup);

// POST /auth/login - User login
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
router.post('/verify-email', authLimiter, validateBody(verifyEmailSchema), authController.verifyEmail);
router.post('/verify-email-otp', authLimiter, validateBody(verifyEmailOtpSchema), authController.verifyEmailOtp);
router.post('/resend-verification-otp', authLimiter, validateBody(resendVerificationOtpSchema), authController.resendVerificationOtp);
router.get('/google', authLimiter, authController.googleLogin);
router.get('/google/callback', authLimiter, authController.googleCallback);
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), authController.resetPassword);
router.get('/me', optionalAuthMiddleware, authController.me);
router.post('/logout', authController.logout);

module.exports = router;


