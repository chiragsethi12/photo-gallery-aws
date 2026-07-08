// middleware/validation.js - Input payload validation schemas using express-validator
const { body, validationResult } = require('express-validator');

/**
 * handleValidationErrors
 * Interceptor middleware checking validationResult and returning 400 on error.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Collect the first error message to ensure backwards compatibility with tests
    const firstError = errors.array()[0].msg;
    return res.status(400).json({ error: firstError });
  }
  next();
};

const registerValidation = [
  // 1. Mandatory presence check first
  body('name').trim().notEmpty().withMessage('Please provide name, email, and password.'),
  body('email').trim().notEmpty().withMessage('Please provide name, email, and password.'),
  body('password').notEmpty().withMessage('Please provide name, email, and password.'),
  
  // 2. Format checks second
  body('email').isEmail().withMessage('Please provide a valid email address.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
  
  handleValidationErrors,
];

const loginValidation = [
  // 1. Mandatory presence check first
  body('email').trim().notEmpty().withMessage('Please provide email and password.'),
  body('password').notEmpty().withMessage('Please provide email and password.'),
  
  // 2. Format checks second
  body('email').isEmail().withMessage('Please provide a valid email address.'),
  
  handleValidationErrors,
];

const uploadValidation = [
  // Title validation (max 200 characters if provided)
  body('title')
    .optional({ checkFalsy: true })
    .isLength({ max: 200 })
    .withMessage('Title must be at most 200 characters long.'),
  
  // Tags count validation (max 10 items if provided)
  body('tags')
    .optional({ checkFalsy: true })
    .custom((value) => {
      let parsed = [];
      if (Array.isArray(value)) {
        parsed = value;
      } else if (typeof value === 'string') {
        try {
          const jsonParsed = JSON.parse(value);
          if (Array.isArray(jsonParsed)) {
            parsed = jsonParsed;
          } else {
            parsed = value.split(',').map(t => t.trim()).filter(Boolean);
          }
        } catch (e) {
          parsed = value.split(',').map(t => t.trim()).filter(Boolean);
        }
      }
      
      if (parsed.length > 10) {
        throw new Error('Tags cannot exceed 10 items.');
      }
      return true;
    }),

  handleValidationErrors,
];

module.exports = {
  registerValidation,
  loginValidation,
  uploadValidation,
};
