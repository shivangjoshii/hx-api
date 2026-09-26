import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import focusRoutes from './focusRoutes.js';
import blockingRoutes from './blockingRoutes.js';
import habitRoutes from './habitRoutes.js';
import goalRoutes from './goalRoutes.js';
import scheduleRoutes from './scheduleRoutes.js';
import roomRoutes from './roomRoutes.js';
import leaderboardRoutes from './leaderboardRoutes.js';
import gamificationRoutes from './gamificationRoutes.js';
import aiRoutes from './aiRoutes.js';
import screenTimeRoutes from './screenTimeRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import musicRoutes from './musicRoutes.js';
import syncRoutes from './syncRoutes.js';

const apiRouter = Router();

apiRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    product: 'HabitX API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/focus', focusRoutes);
apiRouter.use('/blocking', blockingRoutes);
apiRouter.use('/habits', habitRoutes);
apiRouter.use('/goals', goalRoutes);
apiRouter.use('/schedules', scheduleRoutes);
apiRouter.use('/rooms', roomRoutes);
apiRouter.use('/leaderboard', leaderboardRoutes);
apiRouter.use('/gamification', gamificationRoutes);
apiRouter.use('/ai', aiRoutes);
apiRouter.use('/screen-time', screenTimeRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/music', musicRoutes);
apiRouter.use('/sync', syncRoutes);

export default apiRouter;
