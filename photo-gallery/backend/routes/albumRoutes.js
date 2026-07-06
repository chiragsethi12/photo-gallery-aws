// routes/albumRoutes.js - Express router for album endpoints
const express = require('express');
const router = express.Router();
const {
  createAlbum,
  getAlbums,
  getAlbumById,
  deleteAlbum,
} = require('../controllers/albumController');

// POST /api/albums - Create a new album
router.post('/', createAlbum);

// GET /api/albums - Get all albums
router.get('/', getAlbums);

// GET /api/albums/:id - Get a single album by ID
router.get('/:id', getAlbumById);

// DELETE /api/albums/:id - Delete an album by ID
router.delete('/:id', deleteAlbum);

module.exports = router;
