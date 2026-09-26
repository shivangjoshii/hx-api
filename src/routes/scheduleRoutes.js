import { Router } from 'express';
import Joi from 'joi';
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getUpcomingSchedule
} from '../controllers/scheduleController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const createScheduleSchema = Joi.object({
  name: Joi.string().required(),
  days: Joi.array().items(Joi.number().min(0).max(6)).required(),
  startTime: Joi.string().required(),
  endTime: Joi.string().required(),
  focusType: Joi.string().allow(''),
  durationMinutes: Joi.number().min(1),
  blockedApps: Joi.array().items(Joi.string()),
  strictMode: Joi.boolean(),
  recurring: Joi.boolean()
});

router.use(authenticate);

router.get('/', getSchedules);
router.post('/', validate(createScheduleSchema), createSchedule);
router.get('/upcoming', getUpcomingSchedule);
router.patch('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

export default router;
