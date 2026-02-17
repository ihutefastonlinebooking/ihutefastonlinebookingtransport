import { apiResponse } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Handle Joi validation errors
  if (err.name === 'ValidationError' && err.isJoi) {
    const details = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    return res.status(400).json(apiResponse.error('Validation failed', 400, details));
  }

  // Handle Custom AppError
  if (err.name === 'AppError') {
    return res.status(err.statusCode).json(apiResponse.error(
      err.message,
      err.statusCode,
      err.details
    ));
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(apiResponse.error('Invalid token', 401));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(apiResponse.error('Token expired', 401));
  }

  // Handle database errors
  if (err.code === 'ECONNREFUSED') {
    return res.status(500).json(apiResponse.error('Database connection failed', 500));
  }

  if (err.code === '23505') {
    return res.status(409).json(apiResponse.error('Duplicate entry', 409));
  }

  if (err.code === '23503') {
    return res.status(400).json(apiResponse.error('Invalid reference', 400));
  }

  // Handle generic errors
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json(apiResponse.error(message, statusCode));
};

export const notFoundHandler = (req, res, next) => {
  res.status(404).json(apiResponse.error(`Route not found: ${req.originalUrl}`, 404));
};

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
