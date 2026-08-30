import { validationResult } from 'express-validator';
import { AppError } from './errorMiddleware.js';

export function validate(validations) {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    return next(
      new AppError('Validation failed for request body', 422, 'VALIDATION_ERROR', extractedErrors)
    );
  };
}
