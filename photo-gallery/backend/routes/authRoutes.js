// routes/authRoutes.js - Express router for auth endpoints
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { register, login } = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../middleware/validation');

// Stricter rate limiter for authentication routes to slow down brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 register/login requests per 15 minutes
  message: { error: 'Too many auth attempts from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/register
router.post('/register', authLimiter, registerValidation, register);

// POST /api/auth/login
router.post('/login', authLimiter, loginValidation, login);

module.exports = router;
