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
  max: (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'test-server') ? 1000 : 10, // Limit each IP to 10 register/login requests per 15 minutes (higher for tests)
  message: { error: 'Too many auth attempts from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registered successfully
 *       400:
 *         description: Bad request / user exists
 */
router.post('/register', authLimiter, registerValidation, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login existing user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authLimiter, loginValidation, login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *       400:
 *         description: Refresh token required
 *       401:
 *         description: Invalid or expired refresh token / token reuse detected
 */
router.post('/refresh', authLimiter, refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout and revoke active refresh token session
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       400:
 *         description: Refresh token required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 */
router.post('/logout', protect, logout);

/**
 * @swagger
 * /api/auth/sessions:
 *   get:
 *     summary: Get all active sessions for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active sessions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/sessions', protect, getSessions);

/**
 * @swagger
 * /api/auth/sessions/{id}:
 *   delete:
 *     summary: Revoke/delete a specific session
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session successfully revoked
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - cannot delete another user's session
 *       404:
 *         description: Session not found
 */
router.delete('/sessions/:id', protect, deleteSession);

module.exports = router;
