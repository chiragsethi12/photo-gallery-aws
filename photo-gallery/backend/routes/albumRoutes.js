// routes/albumRoutes.js - Express router for album endpoints
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createAlbum,
  getAlbums,
  getAlbumById,
  deleteAlbum,
} = require('../controllers/albumController');

// POST /api/albums - Create a new album (Protected)
router.post('/', protect, createAlbum);

// GET /api/albums - Get all albums (Public)
router.get('/', getAlbums);

// GET /api/albums/:id - Get a single album by ID (Public)
router.get('/:id', getAlbumById);

// DELETE /api/albums/:id - Delete an album by ID (Protected)
router.delete('/:id', protect, deleteAlbum);

module.exports = router;
