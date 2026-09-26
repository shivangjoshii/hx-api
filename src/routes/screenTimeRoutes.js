import { Router } from 'express';
import Joi from 'joi';
import {
  logDailyScreenTime,
  getDailyScreenTime,
  getWeeklyScreenTime
} from '../controllers/screenTimeController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const logScreenTimeSchema = Joi.object({
  dateString: Joi.string(),
  totalScreenTimeMinutes: Joi.number().min(0),
  productiveMinutes: Joi.number().min(0),
  distractedMinutes: Joi.number().min(0),
  neutralMinutes: Joi.number().min(0),
  unplannedAppOpens: Joi.number().min(0),
  blockInterventions: Joi.number().min(0),
  interruptionsCount: Joi.number().min(0),
  appUsages: Joi.array().items(
    Joi.object({
      packageIdentifier: Joi.string().required(),
      displayName: Joi.string().required(),
      category: Joi.string().allow(''),
      classification: Joi.string().valid('Productive', 'Distracting', 'Neutral', 'Ignore'),
      durationMinutes: Joi.number().min(0),
      openCount: Joi.number().min(0)
    })
  )
});

router.use(authenticate);

router.post('/log', validate(logScreenTimeSchema), logDailyScreenTime);
router.get('/daily', getDailyScreenTime);
router.get('/weekly', getWeeklyScreenTime);

export default router;
