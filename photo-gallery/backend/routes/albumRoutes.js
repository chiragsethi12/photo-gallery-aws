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

/**
 * @swagger
 * /api/albums:
 *   post:
 *     summary: Create a new album
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               coverImage:
 *                 type: string
 *     responses:
 *       201:
 *         description: Album created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', protect, createAlbum);

/**
 * @swagger
 * /api/albums:
 *   get:
 *     summary: Get all albums
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *           enum: [all, mine, shared]
 *         description: Filter albums by ownership scope
 *     responses:
 *       200:
 *         description: List of albums retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', protect, getAlbums);

/**
 * @swagger
 * /api/albums/{id}:
 *   get:
 *     summary: Get a single album by ID
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
 *         description: Album details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - does not have viewer role access
 *       404:
 *         description: Album not found
 */
router.get('/:id', protect, requireAlbumRole('viewer', 'id'), getAlbumById);

/**
 * @swagger
 * /api/albums/{id}:
 *   delete:
 *     summary: Soft-delete an album by ID
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
 *         description: Album soft-deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the owner of the album
 *       404:
 *         description: Album not found
 */
router.delete('/:id', protect, deleteAlbum);

/**
 * @swagger
 * /api/albums/{id}/restore:
 *   post:
 *     summary: Restore a soft-deleted album
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
 *         description: Album restored successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the owner of the album
 *       404:
 *         description: Album not found
 */
router.post('/:id/restore', protect, restoreAlbum);

/**
 * @swagger
 * /api/albums/{id}/permanent:
 *   delete:
 *     summary: Permanently delete an album
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
 *         description: Album permanently deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the owner of the album
 *       404:
 *         description: Album not found
 */
router.delete('/:id/permanent', protect, permanentDeleteAlbum);

/**
 * @swagger
 * /api/albums/{id}/collaborators:
 *   post:
 *     summary: Add a collaborator to an album
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
 *               - email
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [viewer, contributor]
 *     responses:
 *       200:
 *         description: Collaborator added successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the owner of the album
 *       404:
 *         description: Album or collaborator user not found
 */
router.post('/:id/collaborators', protect, addCollaborator);

/**
 * @swagger
 * /api/albums/{id}/collaborators/{userId}:
 *   delete:
 *     summary: Remove a collaborator from an album
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Collaborator removed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the owner of the album
 *       404:
 *         description: Album not found
 */
router.delete('/:id/collaborators/:userId', protect, removeCollaborator);

/**
 * @swagger
 * /api/albums/{id}/collaborators/{userId}:
 *   patch:
 *     summary: Update collaborator role on an album
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
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
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [viewer, contributor]
 *     responses:
 *       200:
 *         description: Collaborator role updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the owner of the album
 *       404:
 *         description: Album or collaborator not found
 */
router.patch('/:id/collaborators/:userId', protect, updateCollaboratorRole);

/**
 * @swagger
 * /api/albums/{id}/activity:
 *   get:
 *     summary: Get album activity feed logs
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
 *         description: Paginated album activities retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - does not have viewer access
 *       404:
 *         description: Album not found
 */
router.get('/:id/activity', protect, requireAlbumRole('viewer', 'id'), getAlbumActivity);

module.exports = router;
