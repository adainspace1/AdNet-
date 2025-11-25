const winston = require('winston');

/**
 * Winston logger configuration
 * Logs errors to file and console based on environment
 */
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        // Write all errors to error.log
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Write all logs to combined.log
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    ]
});

// Also log to console in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

/**
 * Centralized error handling middleware
 * Sanitizes error messages and logs detailed errors server-side
 */
const errorHandler = (err, req, res, next) => {
    // Log the full error details server-side
    logger.error({
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userId: req.session?.userId || 'unauthenticated',
        timestamp: new Date().toISOString()
    });

    // Determine status code
    const statusCode = err.statusCode || err.status || 500;

    // Prepare sanitized error response
    const errorResponse = {
        success: false,
        message: 'An error occurred'
    };

    // In development, provide more details
    if (process.env.NODE_ENV !== 'production') {
        errorResponse.message = err.message;
        errorResponse.stack = err.stack;
    } else {
        // In production, provide user-friendly messages based on error type
        switch (statusCode) {
            case 400:
                errorResponse.message = 'Invalid request data';
                break;
            case 401:
                errorResponse.message = 'Authentication required';
                break;
            case 403:
                errorResponse.message = 'Access forbidden';
                break;
            case 404:
                errorResponse.message = 'Resource not found';
                break;
            case 429:
                errorResponse.message = 'Too many requests, please try again later';
                break;
            case 500:
            default:
                errorResponse.message = 'Internal server error';
                break;
        }
    }

    // Send error response
    res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * 404 Not Found handler
 * Should be registered after all routes
 */
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

/**
 * Custom error class for application errors
 */
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = {
    errorHandler,
    asyncHandler,
    notFoundHandler,
    AppError,
    logger
};
