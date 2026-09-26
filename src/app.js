import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import apiRouter from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { ENV } from './config/env.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: ENV.CORS_ORIGIN,
    credentials: true
  })
);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (ENV.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use('/api', apiRateLimiter);

app.use('/test', express.static('test'));

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to HabitX API - Calm Attention Management System',
    status: 'online',
    version: '1.0.0',
    docs: '/api/v1/health'
  });
});

app.use('/api/v1', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
