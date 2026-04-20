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
 * DELETE /api/image/:key
 * :key is the full S3 object key (URL-encoded), e.g. "photos%2Fuuid.jpg"
 */
router.delete('/image/:key(*)', deleteImage);

module.exports = router;
