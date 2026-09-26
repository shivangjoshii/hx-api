import { Router } from 'express';
import Joi from 'joi';
import {
  getProfile,
  updateProfile,
  uploadAvatarImage,
  updatePreferences,
  updateOnboarding,
  changePassword,
  exportUserData,
  deleteAccount
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadAvatar } from '../config/cloudinary.js';

const router = Router();

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  avatar: Joi.string().allow('')
});

const updatePreferencesSchema = Joi.object({
  theme: Joi.string().valid('system', 'light', 'dark', 'midnight', 'lavender_night', 'mono', 'aurora', 'forest', 'ocean'),
  defaultFocusDuration: Joi.number().min(1).max(240),
  defaultBreakDuration: Joi.number().min(1).max(60),
  defaultLongBreakDuration: Joi.number().min(1).max(60),
  autoStartBreak: Joi.boolean(),
  autoStartNextSession: Joi.boolean(),
  soundEnabled: Joi.boolean(),
  soundPreset: Joi.string(),
  strictModeDefault: Joi.boolean(),
  doomscrollProtection: Joi.object({
    instagramReels: Joi.boolean(),
    youtubeShorts: Joi.boolean(),
    facebookReels: Joi.boolean(),
    snapchatSpotlight: Joi.boolean()
  }),
  notifications: Joi.object({
    focusReminders: Joi.boolean(),
    habitReminders: Joi.boolean(),
    streakReminders: Joi.boolean(),
    smartNudges: Joi.boolean(),
    weeklyReview: Joi.boolean()
  })
});

const updateOnboardingSchema = Joi.object({
  goals: Joi.array().items(Joi.string()),
  distractions: Joi.array().items(Joi.string()),
  focusTargetMinutes: Joi.number().min(10).max(720),
  bestFocusTime: Joi.string()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().allow(''),
  newPassword: Joi.string().min(6).required()
});

router.use(authenticate);

router.get('/profile', getProfile);
router.patch('/profile', validate(updateProfileSchema), updateProfile);
router.post('/avatar', uploadAvatar.single('avatar'), uploadAvatarImage);
router.patch('/preferences', validate(updatePreferencesSchema), updatePreferences);
router.post('/onboarding', validate(updateOnboardingSchema), updateOnboarding);
router.post('/change-password', validate(changePasswordSchema), changePassword);
router.get('/export', exportUserData);
router.delete('/account', deleteAccount);

export default router;
