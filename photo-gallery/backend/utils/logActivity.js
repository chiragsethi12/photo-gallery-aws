// utils/logActivity.js - Utility to write album activities in background without blocking response
const Activity = require('../models/Activity');

/**
 * logActivity
 * Logs an action in the Activity history of a specific album.
 * Runs asynchronously and handles db issues silently.
 *
 * @param {String} albumId - Album ObjectId
 * @param {String} actorId - User ObjectId who performed the action
 * @param {String} type - 'upload' | 'comment' | 'collaborator_added' | 'collaborator_removed' | 'image_deleted'
 * @param {Object} [metadata] - Optional additional details
 */
const logActivity = (albumId, actorId, type, metadata = {}) => {
  if (!albumId || !actorId || !type) return;

  Activity.create({
    album: albumId,
    actor: actorId,
    type,
    metadata,
  }).catch((err) => {
    console.warn(`⚠️ Failed to log activity [${type}] for album [${albumId}]:`, err.message);
  });
};

module.exports = logActivity;
