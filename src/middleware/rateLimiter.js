import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    success: false,
    message: 'Too many authentication attempts, please try again in 15 minutes.'
  }
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    success: false,
    message: 'Too many requests, please slow down.'
  }
});
