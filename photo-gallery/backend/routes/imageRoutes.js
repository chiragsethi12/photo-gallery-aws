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
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a single photo
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *               tags:
 *                 type: string
 *                 description: Comma-separated list of tags
 *               album:
 *                 type: string
 *                 description: Album ObjectId
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: Bad request (validation errors)
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Conflict (duplicate content hash detected)
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
 * @swagger
 * /api/images:
 *   get:
 *     summary: Query list of images
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated tags matching intersection
 *       - in: query
 *         name: album
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, name]
 *     responses:
 *       200:
 *         description: List of images matching filters
 *       401:
 *         description: Unauthorized (if filtering by album and not logged in)
 *       403:
 *         description: Forbidden (if filtering by album and user has no access)
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
 * @swagger
 * /api/trash:
 *   get:
 *     summary: Get all soft-deleted items in the trash
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trashed images and albums retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/trash', protect, getTrashItems);

/**
 * @swagger
 * /api/image/{id}/permanent:
 *   delete:
 *     summary: Permanently delete an image record and file
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted permanently
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the owner of the image
 *       404:
 *         description: Image not found
 */
router.delete('/image/:id/permanent', protect, permanentDeleteImage);

/**
 * @swagger
 * /api/image/{publicId}:
 *   delete:
 *     summary: Soft-delete an image by publicId
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image soft-deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the owner of the image
 *       404:
 *         description: Image not found
 */
router.delete('/image/:publicId(*)', protect, deleteImage);

/**
 * @swagger
 * /api/image/{id}/restore:
 *   post:
 *     summary: Restore a soft-deleted image
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image restored successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the owner of the image
 *       404:
 *         description: Image not found
 */
router.post('/image/:id/restore', protect, restoreImage);

/**
 * @swagger
 * /api/image/{id}/favorite:
 *   post:
 *     summary: Toggle favorited state on an image
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Favorited state toggled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Image not found
 */
router.post('/image/:id/favorite', protect, toggleFavoriteImage);

/**
 * @swagger
 * /api/image/{id}/comments:
 *   post:
 *     summary: Add a comment to an image
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - does not have image viewer access
 *       404:
 *         description: Image not found
 */
router.post('/image/:id/comments', protect, addComment);

/**
 * @swagger
 * /api/image/{id}/comments:
 *   get:
 *     summary: Get comments for an image
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of comments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - does not have image viewer access
 *       404:
 *         description: Image not found
 */
router.get('/image/:id/comments', protect, getComments);

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not comment author or album owner
 *       404:
 *         description: Comment not found
 */
router.delete('/comments/:id', protect, deleteComment);

module.exports = router;
