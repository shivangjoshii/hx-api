import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { ENV } from '../config/env.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = '';

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      throw ApiError.unauthorized('Authentication token is required');
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      throw ApiError.unauthorized('User not found or session expired');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Invalid or expired token'));
    }
    next(error);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token = '';
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch {
    next();
  }
};

export const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN
  });

  const refreshToken = jwt.sign({ userId }, ENV.JWT_REFRESH_SECRET, {
    expiresIn: ENV.JWT_REFRESH_EXPIRES_IN
  });

  return { accessToken, refreshToken };
};
