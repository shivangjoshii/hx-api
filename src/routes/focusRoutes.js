import { Router } from 'express';
import Joi from 'joi';
import {
  startFocusSession,
  getActiveFocusSession,
  pauseFocusSession,
  resumeFocusSession,
  finishFocusSession,
  abandonFocusSession,
  getFocusHistory,
  getFocusSummary
} from '../controllers/focusController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const startSessionSchema = Joi.object({
  title: Joi.string().allow(''),
  category: Joi.string().allow(''),
  mode: Joi.string().valid('timer', 'pomodoro', 'stopwatch', 'deep_work', 'study_mode', 'digital_detox', 'sleep_mode'),
  plannedDurationMinutes: Joi.number().min(1).max(720),
  strictMode: Joi.boolean(),
  blockedApps: Joi.array().items(Joi.string()),
  soundTrack: Joi.string().allow(''),
  scheduleId: Joi.string().allow(null, ''),
  goalId: Joi.string().allow(null, ''),
  pomodoroRoundsTotal: Joi.number().min(1).max(12)
});

const finishSessionSchema = Joi.object({
  actualDurationSeconds: Joi.number().min(0),
  interruptionsCount: Joi.number().min(0),
  pomodoroRoundsCompleted: Joi.number().min(0),
  notes: Joi.string().allow('')
});

router.use(authenticate);

router.post('/start', validate(startSessionSchema), startFocusSession);
router.get('/active', getActiveFocusSession);
router.post('/:id/pause', pauseFocusSession);
router.post('/:id/resume', resumeFocusSession);
router.post('/:id/finish', validate(finishSessionSchema), finishFocusSession);
router.post('/:id/abandon', abandonFocusSession);
router.get('/history', getFocusHistory);
router.get('/summary', getFocusSummary);

export default router;
