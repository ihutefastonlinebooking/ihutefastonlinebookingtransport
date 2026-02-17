// Standard API Response Format
export const apiResponse = {
  success: (data, message = 'Success', statusCode = 200) => {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  },

  error: (message, statusCode = 400, errors = null) => {
    return {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    };
  },

  paginated: (data, page, limit, total) => {
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    };
  },
};

// Custom Error Class
export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common HTTP Errors
export const errors = {
  badRequest: (message, details) => 
    new AppError(message || 'Bad Request', 400, details),
  
  unauthorized: (message) => 
    new AppError(message || 'Unauthorized', 401),
  
  forbidden: (message) => 
    new AppError(message || 'Forbidden', 403),
  
  notFound: (message) => 
    new AppError(message || 'Not Found', 404),
  
  conflict: (message, details) => 
    new AppError(message || 'Conflict', 409, details),
  
  unprocessable: (message, details) => 
    new AppError(message || 'Unprocessable Entity', 422, details),
  
  tooMany: (message) => 
    new AppError(message || 'Too Many Requests', 429),
  
  serverError: (message) => 
    new AppError(message || 'Internal Server Error', 500),
};

export default {
  apiResponse,
  AppError,
  errors,
};
