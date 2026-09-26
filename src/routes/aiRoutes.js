import { Router } from 'express';
import { getAICompanionInsights, getAIWeeklyReview } from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/companion', getAICompanionInsights);
router.get('/weekly-review', getAIWeeklyReview);

export default router;
