// routes/imageRoutes.js - Express router for image-related endpoints
const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload');
const {
  uploadImage,
  getImages,
  deleteImage,
} = require('../controllers/imageController');

/**
 * POST /api/upload
 * Accepts a single file field named "image".
 * multer processes the file, then the controller uploads it to S3.
 */
router.post('/upload', upload.single('image'), (req, res, next) => {
  // Handle multer-specific errors (e.g. wrong file type, file too large)
  uploadImage(req, res, next);
});

/**
 * GET /api/images
 * Returns a JSON array of all images stored in the S3 bucket.
 */
router.get('/images', getImages);

/**
 * DELETE /api/image/:publicId
 * :publicId is the full Cloudinary public_id (URL-encoded), e.g. "photo-gallery%2Fuuid"
 */
router.delete('/image/:publicId(*)', deleteImage);

module.exports = router;
