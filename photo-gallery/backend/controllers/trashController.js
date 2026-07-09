// controllers/trashController.js - Handle trash retrieval logic
const Image = require('../models/Image');
const Album = require('../models/Album');
const { wrapAsync } = require('../middleware/errorHandler');

/**
 * GET /api/trash
 * Retrieves soft-deleted images and albums for the logged-in user.
 */
const getTrashItems = wrapAsync(async (req, res) => {
  const userId = req.user.id;

  const images = await Image.find({ uploadedBy: userId, isDeleted: true });
  const albums = await Album.find({ createdBy: userId, isDeleted: true });

  res.status(200).json({
    images,
    albums,
  });
});

module.exports = {
  getTrashItems,
};
