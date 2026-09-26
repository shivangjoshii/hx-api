import { Router } from 'express';
import Joi from 'joi';
import {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  logHabit,
  getHabitLogs
} from '../controllers/habitController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const createHabitSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(''),
  type: Joi.string().valid('boolean', 'duration', 'quantity', 'count', 'negative'),
  target: Joi.number().min(1),
  unit: Joi.string().allow(''),
  frequency: Joi.string().valid('everyday', 'weekdays', 'weekends', 'specific_days', 'weekly', 'custom'),
  frequencyDays: Joi.array().items(Joi.number().min(0).max(6)),
  reminderTime: Joi.string().allow(''),
  goalId: Joi.string().allow(null, ''),
  color: Joi.string().allow(''),
  icon: Joi.string().allow('')
});

const logHabitSchema = Joi.object({
  dateString: Joi.string(),
  status: Joi.string().valid('completed', 'skipped', 'failed', 'pending'),
  value: Joi.number().min(0),
  notes: Joi.string().allow('')
});

router.use(authenticate);

router.get('/', getHabits);
router.post('/', validate(createHabitSchema), createHabit);
router.patch('/:id', updateHabit);
router.delete('/:id', deleteHabit);
router.post('/:id/log', validate(logHabitSchema), logHabit);
router.get('/:id/calendar', getHabitLogs);

export default router;
