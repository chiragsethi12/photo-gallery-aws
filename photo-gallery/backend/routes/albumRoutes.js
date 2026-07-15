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
  addCollaborator,
  removeCollaborator,
  updateCollaboratorRole,
  getAlbumActivity,
} = require('../controllers/albumController');
const { requireAlbumRole } = require('../middleware/albumAccess');

// POST /api/albums - Create a new album (Protected)
router.post('/', protect, createAlbum);

// GET /api/albums - Get all albums (Protected)
router.get('/', protect, getAlbums);

// GET /api/albums/:id - Get a single album by ID (Protected - Viewer access required)
router.get('/:id', protect, requireAlbumRole('viewer', 'id'), getAlbumById);

// DELETE /api/albums/:id - Delete an album by ID (Protected) (soft-delete)
router.delete('/:id', protect, deleteAlbum);

// POST /api/albums/:id/restore - Restore a soft-deleted album (Protected)
router.post('/:id/restore', protect, restoreAlbum);

// DELETE /api/albums/:id/permanent - Permanently delete an album (Protected)
router.delete('/:id/permanent', protect, permanentDeleteAlbum);

// POST /api/albums/:id/collaborators - Add collaborator (Protected - Owner only)
router.post('/:id/collaborators', protect, addCollaborator);

// DELETE /api/albums/:id/collaborators/:userId - Remove collaborator (Protected - Owner only)
router.delete('/:id/collaborators/:userId', protect, removeCollaborator);

// PATCH /api/albums/:id/collaborators/:userId - Update collaborator role (Protected - Owner only)
router.patch('/:id/collaborators/:userId', protect, updateCollaboratorRole);

// GET /api/albums/:id/activity - Get paginated activities (Protected - Viewer access required)
router.get('/:id/activity', protect, requireAlbumRole('viewer', 'id'), getAlbumActivity);

module.exports = router;
