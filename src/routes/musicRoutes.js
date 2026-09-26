import { Router } from 'express';
import { getMusicTracks } from '../controllers/musicController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/tracks', optionalAuth, getMusicTracks);

export default router;
