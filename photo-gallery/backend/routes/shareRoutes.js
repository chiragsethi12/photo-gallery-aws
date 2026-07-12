// routes/shareRoutes.js - Express router for creating, resolving, and revoking share links
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createShareLink,
  resolveShareLink,
  revokeShareLink,
} = require('../controllers/shareController');
const rateLimit = require('express-rate-limit');

// Dedicated rate limiter to prevent password guessing brute-force vectors on shared links
const shareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per windowMs
  message: { error: 'Too many requests on share resources from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/share - Create shareable link (Protected)
router.post('/', protect, createShareLink);

// GET /api/share/:token - Resolve link to access resource (Public, Gated with stricter rate limiter)
router.get('/:token', shareLimiter, resolveShareLink);

// DELETE /api/share/:token - Revoke link immediately (Protected)
router.delete('/:token', protect, revokeShareLink);

module.exports = router;
