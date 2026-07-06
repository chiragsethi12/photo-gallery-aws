// routes/imageRoutes.js - Express router for image-related endpoints
const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload');
const { protect } = require('../middleware/authMiddleware');
const {
  uploadImage,
  getImages,
  deleteImage,
  toggleFavoriteImage,
} = require('../controllers/imageController');

/**
 * POST /api/upload
 * Accepts a single file field named "image".
 * Only accessible to authenticated users.
 */
router.post('/upload', protect, upload.single('image'), (req, res, next) => {
  uploadImage(req, res, next);
});

/**
 * GET /api/images
 * Returns a JSON array/object of all images (Public).
 */
router.get('/images', getImages);

/**
 * DELETE /api/image/:publicId
 * Only accessible to the authenticated owner.
 */
router.delete('/image/:publicId(*)', protect, deleteImage);

/**
 * POST /api/image/:id/favorite
 * Toggles favorite state on a photo for the current user.
 */
router.post('/image/:id/favorite', protect, toggleFavoriteImage);

module.exports = router;
