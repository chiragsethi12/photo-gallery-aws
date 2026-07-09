// routes/authRoutes.js - Express router for auth endpoints
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  register,
  login,
  refresh,
  logout,
  getSessions,
  deleteSession,
} = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../middleware/validation');
const { protect } = require('../middleware/authMiddleware');

// Stricter rate limiter for authentication routes to slow down brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 10, // Limit each IP to 10 register/login requests per 15 minutes (higher for tests)
  message: { error: 'Too many auth attempts from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/register
router.post('/register', authLimiter, registerValidation, register);

// POST /api/auth/login
router.post('/login', authLimiter, loginValidation, login);

// POST /api/auth/refresh (Rate limited)
router.post('/refresh', authLimiter, refresh);

// POST /api/auth/logout (Protected)
router.post('/logout', protect, logout);

// GET /api/auth/sessions (Protected)
router.get('/sessions', protect, getSessions);

// DELETE /api/auth/sessions/:id (Protected)
router.delete('/sessions/:id', protect, deleteSession);

module.exports = router;
