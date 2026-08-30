export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorMiddleware(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details = err.details || null;

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'AUTH_INVALID';
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'AUTH_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Handle Mongoose / Schema validation errors
  if (err.name === 'ValidationError') {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    details = Object.values(err.errors || {}).map((e) => e.message);
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    code = 'DOCUMENT_PARSE_FAILURE';
    message = `Upload error: ${err.message}`;
  }

  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error] ${code} (${statusCode}):`, message, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}
