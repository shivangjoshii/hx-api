import { ApiError } from '../utils/apiError.js';

export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return next(ApiError.badRequest('Validation failed', errorMessages));
    }

    req[property] = value;
    next();
  };
};
