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
  restoreImage,
  permanentDeleteImage,
} = require('../controllers/imageController');
const { getTrashItems } = require('../controllers/trashController');
const { uploadValidation } = require('../middleware/validation');
const { requireAlbumRole } = require('../middleware/albumAccess');
const {
  addComment,
  getComments,
  deleteComment,
} = require('../controllers/commentController');

/**
 * POST /api/upload
 * Accepts a single file field named "image".
 * Only accessible to authenticated users.
 */
router.post(
  '/upload',
  protect,
  upload.single('image'),
  uploadValidation,
  requireAlbumRole('contributor', 'body'),
  (req, res, next) => {
    uploadImage(req, res, next);
  }
);

/**
 * GET /api/images
 * Returns a JSON array/object of all images. Enforces authorization when filtering by album.
 */
router.get('/images', (req, res, next) => {
  if (req.query.album) {
    return protect(req, res, (err) => {
      if (err) return next(err);
      requireAlbumRole('viewer', 'query')(req, res, (err2) => {
        if (err2) return next(err2);
        getImages(req, res, next);
      });
    });
  }
  return getImages(req, res, next);
});

/**
 * GET /api/trash
 * Retrieves soft-deleted images and albums for the logged-in user.
 */
router.get('/trash', protect, getTrashItems);

/**
 * DELETE /api/image/:id/permanent
 * Permanently deletes an image (ownership protected).
 */
router.delete('/image/:id/permanent', protect, permanentDeleteImage);

/**
 * DELETE /api/image/:publicId
 * Only accessible to the authenticated owner (soft-delete).
 */
router.delete('/image/:publicId(*)', protect, deleteImage);

/**
 * POST /api/image/:id/restore
 * Restores a soft-deleted image (ownership protected).
 */
router.post('/image/:id/restore', protect, restoreImage);

/**
 * POST /api/image/:id/favorite
 * Toggles favorite state on a photo for the current user.
 */
router.post('/image/:id/favorite', protect, toggleFavoriteImage);

// ── Image Comments Routes ────────────────────────────────────────────────────
router.post('/image/:id/comments', protect, addComment);
router.get('/image/:id/comments', protect, getComments);
router.delete('/comments/:id', protect, deleteComment);

module.exports = router;
