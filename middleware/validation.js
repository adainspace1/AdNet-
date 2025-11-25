const { body, query, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Validation error formatter middleware
 * Extracts validation errors and returns a 400 response
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Validates MongoDB ObjectId
 */
const validateObjectId = (field, optional = false) => {
  const validator = optional ? query(field).optional() : query(field);
  
  return validator
    .custom((value) => {
      if (!value && optional) return true;
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid ID format');
      }
      return true;
    })
    .withMessage(`Invalid ${field} format`);
};

/**
 * Validates MongoDB ObjectId in request body
 */
const validateBodyObjectId = (field, optional = false) => {
  const validator = optional ? body(field).optional() : body(field);
  
  return validator
    .custom((value) => {
      if (!value && optional) return true;
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid ID format');
      }
      return true;
    })
    .withMessage(`Invalid ${field} format`);
};

/**
 * Validates date format (ISO 8601 or common formats)
 */
const validateDate = (field, optional = false) => {
  const validator = optional ? body(field).optional() : body(field);
  
  return validator
    .isISO8601()
    .withMessage(`${field} must be a valid date`)
    .toDate();
};

/**
 * Sanitizes string input to prevent XSS
 */
const sanitizeString = (field, optional = false) => {
  const validator = optional ? body(field).optional() : body(field);
  
  return validator
    .trim()
    .escape()
    .isLength({ min: 1, max: 1000 })
    .withMessage(`${field} must be between 1 and 1000 characters`);
};

/**
 * Validates email format
 */
const validateEmail = (field, optional = false) => {
  const validator = optional ? body(field).optional() : body(field);
  
  return validator
    .isEmail()
    .normalizeEmail()
    .withMessage(`${field} must be a valid email address`);
};

/**
 * Validates numeric input
 */
const validateNumber = (field, min = null, max = null, optional = false) => {
  const validator = optional ? body(field).optional() : body(field);
  
  let chain = validator.isNumeric().withMessage(`${field} must be a number`);
  
  if (min !== null) {
    chain = chain.isFloat({ min }).withMessage(`${field} must be at least ${min}`);
  }
  
  if (max !== null) {
    chain = chain.isFloat({ max }).withMessage(`${field} must be at most ${max}`);
  }
  
  return chain;
};

/**
 * Validates enum values
 */
const validateEnum = (field, allowedValues, optional = false) => {
  const validator = optional ? body(field).optional() : body(field);
  
  return validator
    .isIn(allowedValues)
    .withMessage(`${field} must be one of: ${allowedValues.join(', ')}`);
};

/**
 * Common validation chains for reusable fields
 */
const validators = {
  // User ID in query parameter
  userId: () => validateObjectId('id', false),
  userIdOptional: () => validateObjectId('id', true),
  
  // User ID in body
  bodyUserId: () => validateBodyObjectId('userId', false),
  bodyUserIdOptional: () => validateBodyObjectId('userId', true),
  
  // Recipient ID
  recipientId: () => validateObjectId('recipientId', false),
  bodyRecipientId: () => validateBodyObjectId('recipientId', false),
  
  // Date range validation
  dateRange: () => [
    validateDate('startDate', false),
    validateDate('endDate', false),
    body('endDate').custom((endDate, { req }) => {
      if (new Date(endDate) < new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
  ],
  
  // Email validation
  email: () => validateEmail('email', false),
  
  // Password validation
  password: () => body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
};

module.exports = {
  handleValidationErrors,
  validateObjectId,
  validateBodyObjectId,
  validateDate,
  sanitizeString,
  validateEmail,
  validateNumber,
  validateEnum,
  validators,
  // Re-export for convenience
  body,
  query,
  param
};
