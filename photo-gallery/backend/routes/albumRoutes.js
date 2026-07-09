// routes/albumRoutes.js - Express router for album endpoints
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createAlbum,
  getAlbums,
  getAlbumById,
  deleteAlbum,
  restoreAlbum,
  permanentDeleteAlbum,
} = require('../controllers/albumController');

// POST /api/albums - Create a new album (Protected)
router.post('/', protect, createAlbum);

// GET /api/albums - Get all albums (Public)
router.get('/', getAlbums);

// GET /api/albums/:id - Get a single album by ID (Public)
router.get('/:id', getAlbumById);

// DELETE /api/albums/:id - Delete an album by ID (Protected) (soft-delete)
router.delete('/:id', protect, deleteAlbum);

// POST /api/albums/:id/restore - Restore a soft-deleted album (Protected)
router.post('/:id/restore', protect, restoreAlbum);

// DELETE /api/albums/:id/permanent - Permanently delete an album (Protected)
router.delete('/:id/permanent', protect, permanentDeleteAlbum);

module.exports = router;
