// controllers/analyticsController.js - Analytics aggregation logic using MongoDB aggregation pipelines
const mongoose = require('mongoose');
const Image = require('../models/Image');
const Activity = require('../models/Activity');
const { AppError, wrapAsync } = require('../middleware/errorHandler');

/**
 * GET /api/analytics/storage
 * Returns storage utilization metrics scoped strictly to the requesting user:
 * - totalImageCount: count of non-deleted images.
 * - formatBreakdown: array of { _id: formatName, count }
 * - uploadHistory: weekly upload counts for the last 12 weeks
 */
const getStorageAnalytics = wrapAsync(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 12 * 7);

  // 1. Total Image Count
  const totalImageCount = await Image.countDocuments({
    uploadedBy: userId,
    isDeleted: { $ne: true },
  });

  // 2. Format Breakdown (jpg, png, etc.)
  const formatBreakdown = await Image.aggregate([
    {
      $match: {
        uploadedBy: userId,
        isDeleted: { $ne: true },
      },
    },
    {
      $group: {
        _id: '$format',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  // 3. Upload History (Count grouped by week for the last 12 weeks)
  const uploadHistory = await Image.aggregate([
    {
      $match: {
        uploadedBy: userId,
        isDeleted: { $ne: true },
        createdAt: { $gte: twelveWeeksAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%U', date: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  res.status(200).json({
    totalImageCount,
    formatBreakdown,
    uploadHistory,
  });
});

/**
 * GET /api/analytics/activity
 * Returns current user's activity logs scoped strictly to activities performed by actor:
 * - activityBreakdown: total activities performed by type.
 * - activityHistory: weekly activity count trend.
 */
const getActivityAnalytics = wrapAsync(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 12 * 7);

  // 1. Activity Breakdown by type
  const activityBreakdown = await Activity.aggregate([
    {
      $match: {
        actor: userId,
      },
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  // 2. Activity History (Count grouped by week for the last 12 weeks)
  const activityHistory = await Activity.aggregate([
    {
      $match: {
        actor: userId,
        createdAt: { $gte: twelveWeeksAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%U', date: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  res.status(200).json({
    activityBreakdown,
    activityHistory,
  });
});

module.exports = {
  getStorageAnalytics,
  getActivityAnalytics,
};
