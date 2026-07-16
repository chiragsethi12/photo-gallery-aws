// jobs/trashCleanup.js - Automated daily job to purge soft-deleted items older than 30 days
const cron = require('node-cron');
const Image = require('../models/Image');
const Album = require('../models/Album');
const { permanentlyDeleteImageRecord } = require('../controllers/imageController');
const logger = require('../config/logger');

const runCleanup = async () => {
  logger.info('⏰ Starting automated trash cleanup job...');
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  try {
    // 1. Purge old images
    const oldImages = await Image.find({ isDeleted: true, deletedAt: { $lte: cutoff } });
    logger.info(`🔍 Found ${oldImages.length} expired trashed images to purge.`);
    for (const img of oldImages) {
      try {
        await permanentlyDeleteImageRecord(img.publicId);
      } catch (err) {
        logger.error(`❌ Failed to purge image ${img.publicId}: ${err.message}`);
      }
    }

    // 2. Purge old albums
    const oldAlbums = await Album.find({ isDeleted: true, deletedAt: { $lte: cutoff } });
    logger.info(`🔍 Found ${oldAlbums.length} expired trashed albums to purge.`);
    for (const alb of oldAlbums) {
      try {
        await Image.updateMany({ album: alb._id }, { album: null });
        await Album.findByIdAndDelete(alb._id);
        logger.info(`🗑️ Permanently purged album: ${alb._id}`);
      } catch (err) {
        logger.error(`❌ Failed to purge album ${alb._id}: ${err.message}`);
      }
    }
    logger.info('✅ Automated trash cleanup job completed.');
  } catch (err) {
    logger.error(`❌ Error running trash cleanup job: ${err.message}`);
  }
};

const initTrashCleanupJob = () => {
  if (process.env.NODE_ENV === 'test') {
    logger.info('🚫 Skipping trash cleanup cron job in test environment.');
    return;
  }

  // Schedule daily at 3:00 AM
  cron.schedule('0 3 * * *', runCleanup);
  logger.info('📅 Trash cleanup job scheduled daily at 03:00 AM.');
};

module.exports = {
  initTrashCleanupJob,
  runCleanup,
};
