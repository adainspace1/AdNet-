const rateLimit = require('express-rate-limit');

/**
 * Strict rate limiter for authentication endpoints
 * Limits: 5 requests per 15 minutes
 * Use for: login, registration, password reset
 */
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
        success: false,
        message: 'Too many attempts from this IP, please try again after 15 minutes'
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Custom key generator to use IP address
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
    },
    // Skip successful requests from counting against rate limit
    skipSuccessfulRequests: false,
    // Skip failed requests from counting (set to true if you only want to limit failed attempts)
    skipFailedRequests: false,
});

/**
 * Standard rate limiter for general API endpoints
 * Limits: 100 requests per 15 minutes
 * Use for: Most POST/PUT/DELETE operations
 */
const standardLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
    },
});

/**
 * Lenient rate limiter for read operations
 * Limits: 200 requests per 15 minutes
 * Use for: GET operations, data fetching
 */
const lenientLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per window
    message: {
        success: false,
        message: 'Too many requests from this IP, please slow down'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
    },
});

/**
 * Very strict limiter for sensitive operations
 * Limits: 3 requests per hour
 * Use for: password changes, account deletion, critical operations
 */
const criticalLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 requests per hour
    message: {
        success: false,
        message: 'Too many sensitive operations attempted. Please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
    },
});

/**
 * API rate limiter for external API calls
 * Limits: 50 requests per minute
 * Use for: endpoints that make external API calls
 */
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 50, // 50 requests per minute
    message: {
        success: false,
        message: 'API rate limit exceeded, please try again shortly'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
    },
});

module.exports = {
    strictLimiter,
    standardLimiter,
    lenientLimiter,
    criticalLimiter,
    apiLimiter
};
