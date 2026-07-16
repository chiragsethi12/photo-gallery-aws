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

/**
 * @swagger
 * /api/share:
 *   post:
 *     summary: Create a shareable link for an album or image
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resourceType
 *               - resourceId
 *             properties:
 *               resourceType:
 *                 type: string
 *                 enum: [album, image]
 *               resourceId:
 *                 type: string
 *               password:
 *                 type: string
 *               expiresInDays:
 *                 type: number
 *     responses:
 *       201:
 *         description: Share link successfully created
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the owner of the resource
 */
router.post('/', protect, createShareLink);

/**
 * @swagger
 * /api/share/{token}:
 *   get:
 *     summary: Resolve a share token to fetch the resource details
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: password
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resource details fetched successfully
 *       400:
 *         description: Password required or incorrect
 *       404:
 *         description: Share link not found or expired
 */
router.get('/:token', shareLimiter, resolveShareLink);

/**
 * @swagger
 * /api/share/{token}:
 *   delete:
 *     summary: Revoke a share link immediately
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Share link successfully revoked
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the creator of the share link
 *       404:
 *         description: Share link not found
 */
router.delete('/:token', protect, revokeShareLink);

module.exports = router;
