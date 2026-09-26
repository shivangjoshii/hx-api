import { Router } from 'express';
import Joi from 'joi';
import {
  getGoals,
  createGoal,
  getGoalDetails,
  updateGoal,
  deleteGoal
} from '../controllers/goalController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const createGoalSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(''),
  reason: Joi.string().allow(''),
  targetDate: Joi.date().allow(null),
  targetFocusHours: Joi.number().min(1),
  linkedHabitIds: Joi.array().items(Joi.string()),
  linkedCategories: Joi.array().items(Joi.string()),
  color: Joi.string().allow('')
});

router.use(authenticate);

router.get('/', getGoals);
router.post('/', validate(createGoalSchema), createGoal);
router.get('/:id', getGoalDetails);
router.patch('/:id', updateGoal);
router.delete('/:id', deleteGoal);

export default router;
