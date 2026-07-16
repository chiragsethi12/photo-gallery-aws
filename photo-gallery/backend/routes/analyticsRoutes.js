// routes/analyticsRoutes.js - Express router for analytics reports
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getStorageAnalytics,
  getActivityAnalytics,
} = require('../controllers/analyticsController');

/**
 * @swagger
 * /api/analytics/storage:
 *   get:
 *     summary: Retrieve storage utilization statistics for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Storage analytics successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalImageCount:
 *                   type: integer
 *                 formatBreakdown:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 uploadHistory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Date-truncated week (YYYY-WW)
 *                       count:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/storage', protect, getStorageAnalytics);

/**
 * @swagger
 * /api/analytics/activity:
 *   get:
 *     summary: Retrieve activity metrics performed by the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Activity analytics successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activityBreakdown:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 activityHistory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Date-truncated week (YYYY-WW)
 *                       count:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/activity', protect, getActivityAnalytics);

module.exports = router;
