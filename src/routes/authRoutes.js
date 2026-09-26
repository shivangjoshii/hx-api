import { Router } from 'express';
import Joi from 'joi';
import {
  register,
  verifyEmail,
  resendVerificationOtp,
  login,
  guestLogin,
  oauthLogin,
  forgotPassword,
  resetPassword,
  refreshToken
} from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const verifyEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).required()
});

const oauthSchema = Joi.object({
  provider: Joi.string().valid('google', 'apple').required(),
  email: Joi.string().email().required(),
  name: Joi.string().allow('', null),
  providerId: Joi.string().required(),
  token: Joi.string().allow('', null)
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

router.post('/register', authRateLimiter, validate(registerSchema), register);
router.post('/verify-email', authRateLimiter, validate(verifyEmailSchema), verifyEmail);
router.post('/resend-otp', authRateLimiter, validate(forgotPasswordSchema), resendVerificationOtp);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.post('/guest', guestLogin);
router.post('/oauth', validate(oauthSchema), oauthLogin);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);

export default router;
