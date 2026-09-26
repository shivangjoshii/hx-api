import { Router } from 'express';
import Joi from 'joi';
import {
  getGamificationOverview,
  getAchievements,
  getRewards,
  createReward,
  redeemReward,
  deleteReward
} from '../controllers/gamificationController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const createRewardSchema = Joi.object({
  title: Joi.string().required(),
  costXp: Joi.number().min(10).required(),
  icon: Joi.string().allow('')
});

router.use(authenticate);

router.get('/overview', getGamificationOverview);
router.get('/achievements', getAchievements);
router.get('/rewards', getRewards);
router.post('/rewards', validate(createRewardSchema), createReward);
router.post('/rewards/:id/redeem', redeemReward);
router.delete('/rewards/:id', deleteReward);

export default router;
