// middleware/errorHandler.js - Centralized error handling pattern
class AppError extends Error {
  /**
   * AppError constructor
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode || 500;
    this.isOperational = true; // Distinguishes expected user input/process errors from programmer bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * wrapAsync
 * Wraps asynchronous middleware or controller functions to catch and pass errors to next() automatically.
 * @param {Function} fn - Async middleware or controller function
 * @returns {Function} Express middleware function
 */
const wrapAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * errorHandler
 * Global Express error handling middleware.
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // Log unexpected errors for server diagnostics
  if (!err.isOperational) {
    console.error('💥 UNEXPECTED ERROR:', err);
  } else if (process.env.NODE_ENV !== 'test') {
    console.warn(`⚠️ Operational Error [${statusCode}]:`, err.message);
  }

  // Handle mongoose validation errors or duplicate keys if they bypass validations
  let errorResponse = err.message || 'Something went wrong';
  let finalStatus = statusCode;

  if (err.name === 'ValidationError') {
    finalStatus = 400;
    errorResponse = Object.values(err.errors).map((el) => el.message).join(', ');
  } else if (err.code === 11000) {
    finalStatus = 400;
    errorResponse = 'Duplicate database key error';
  }

  // Operational, trusted error: send message to client
  if (err.isOperational || err.name === 'ValidationError' || err.code === 11000) {
    return res.status(finalStatus).json({
      error: errorResponse,
    });
  }

  // Unhandled programming error: send a generic message
  return res.status(500).json({
    error: 'Something went wrong on the server',
  });
};

module.exports = {
  AppError,
  wrapAsync,
  errorHandler,
};
