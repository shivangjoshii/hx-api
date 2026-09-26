import { Router } from 'express';
import { batchSync } from '../controllers/syncController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/batch', batchSync);

export default router;
