import { ApiError } from '../utils/apiError.js';
import { ENV } from '../config/env.js';

export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Endpoint not found - ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error.errors || [], error.stack);
  }

  const response = {
    statusCode: error.statusCode,
    success: false,
    message: error.message,
    errors: error.errors
  };

  if (ENV.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
};
