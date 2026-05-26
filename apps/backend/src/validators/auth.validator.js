const Joi = require('joi');

const passwordSchema = Joi.string()
  .min(10)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
  .required()
  .messages({
    'string.pattern.base': 'Password must include uppercase, lowercase, number, and special character.',
  });

const signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: passwordSchema,
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(1).max(128).required(),
});

const verifyEmailSchema = Joi.object({
  token: Joi.string().length(64).hex().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().length(64).hex().required(),
  password: passwordSchema,
});

module.exports = {
  signupSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
