// controllers/albumController.js - CRUD operations for Album models
const Album = require('../models/Album');
const Image = require('../models/Image');
const User = require('../models/User');
const { AppError, wrapAsync } = require('../middleware/errorHandler');

/**
 * POST /api/albums
 * Creates a new album with name, description, coverImage URL, and optional creator.
 */
const createAlbum = wrapAsync(async (req, res) => {
  const { name, description, coverImage } = req.body;
  
  if (!name) {
    throw new AppError('Album name is required.', 400);
  }

  const album = new Album({
    name,
    description,
    coverImage,
    createdBy: req.user.id, // Authenticated user
  });

  const savedAlbum = await album.save();
  console.log(`✅ Album created: ${savedAlbum._id}`);
  res.status(201).json(savedAlbum);
});

/**
 * GET /api/albums
 * Retrieves all non-deleted albums based on query scope.
 */
const getAlbums = wrapAsync(async (req, res) => {
  const scope = req.query.scope || 'all';
  const userId = req.user.id;

  const filter = { isDeleted: { $ne: true } };

  if (scope === 'mine') {
    filter.createdBy = userId;
  } else if (scope === 'shared') {
    filter['collaborators.user'] = userId;
  } else {
    // all: owned or collaborated
    filter.$or = [
      { createdBy: userId },
      { 'collaborators.user': userId }
    ];
  }

  const albums = await Album.find(filter).sort({ createdAt: -1 });
  
  const enrichedAlbums = await Promise.all(
    albums.map(async (album) => {
      const imageCount = await Image.countDocuments({ album: album._id, isDeleted: { $ne: true } });
      
      let coverImage = album.coverImage;
      if (!coverImage) {
        const firstImage = await Image.findOne({ album: album._id, isDeleted: { $ne: true } }).sort({ createdAt: 1 });
        if (firstImage) {
          coverImage = firstImage.url;
        }
      }

      return {
        ...album.toObject(),
        imageCount,
        coverImage,
      };
    })
  );

  res.status(200).json(enrichedAlbums);
});

/**
 * GET /api/albums/:id
 * Retrieves a single non-deleted album by its ID.
 */
const getAlbumById = wrapAsync(async (req, res) => {
  const album = req.album || await Album.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!album) {
    throw new AppError('Album not found.', 404);
  }
  
  // Populate collaborator user details (name, email)
  const populatedAlbum = await Album.findById(album._id).populate('collaborators.user', 'name email');

  const imageCount = await Image.countDocuments({ album: album._id, isDeleted: { $ne: true } });
  let coverImage = populatedAlbum.coverImage;
  if (!coverImage) {
    const firstImage = await Image.findOne({ album: album._id, isDeleted: { $ne: true } }).sort({ createdAt: 1 });
    if (firstImage) {
      coverImage = firstImage.url;
    }
  }

  const responseData = populatedAlbum.toObject();
  responseData.role = req.albumRole || 'viewer';

  res.status(200).json({
    ...responseData,
    imageCount,
    coverImage,
  });
});

/**
 * DELETE /api/albums/:id
 * Soft deletes an album by its ID.
 */
const deleteAlbum = wrapAsync(async (req, res) => {
  const album = await Album.findById(req.params.id);
  if (!album) {
    throw new AppError('Album not found.', 404);
  }

  // Check authorization: verify creator ownership
  if (!album.createdBy || album.createdBy.toString() !== req.user.id) {
    throw new AppError('You can only delete your own albums', 403);
  }

  // Perform soft delete (do not nullify images here, wait until permanent delete)
  album.isDeleted = true;
  album.deletedAt = new Date();
  await album.save();

  console.log(`🗑️ Album soft-deleted: ${req.params.id}`);
  res.status(200).json({ message: 'Album soft-deleted successfully!', albumId: req.params.id });
});

/**
 * POST /api/albums/:id/restore
 * Restores a soft-deleted album by its ID.
 */
const restoreAlbum = wrapAsync(async (req, res) => {
  const album = await Album.findById(req.params.id);
  if (!album) {
    throw new AppError('Album not found.', 404);
  }

  // Check authorization: verify creator ownership
  if (!album.createdBy || album.createdBy.toString() !== req.user.id) {
    throw new AppError('You can only restore your own albums', 403);
  }

  album.isDeleted = false;
  album.deletedAt = null;
  await album.save();

  console.log(`🔄 Album restored: ${album.name}`);
  res.status(200).json({ message: 'Album restored successfully!', album });
});

/**
 * DELETE /api/albums/:id/permanent
 * Permanently deletes an album and nulls out referencing images.
 */
const permanentDeleteAlbum = wrapAsync(async (req, res) => {
  const album = await Album.findById(req.params.id);
  if (!album) {
    throw new AppError('Album not found.', 404);
  }

  // Check authorization: verify creator ownership
  if (!album.createdBy || album.createdBy.toString() !== req.user.id) {
    throw new AppError('You can only permanently delete your own albums', 403);
  }

  // Nullify album reference on images that belonged to it (soft-deleted or not)
  await Image.updateMany({ album: album._id }, { album: null });

  // Delete the album itself
  await Album.findByIdAndDelete(req.params.id);

  console.log(`🗑️ Album permanently deleted: ${req.params.id}`);
  res.status(200).json({ message: 'Album permanently deleted successfully!', albumId: req.params.id });
});

/**
 * POST /api/albums/:id/collaborators
 * Owner-only: adds a collaborator by email.
 */
const addCollaborator = wrapAsync(async (req, res) => {
  const album = await Album.findById(req.params.id);
  if (!album) {
    throw new AppError('Album not found.', 404);
  }

  // Owner check
  if (!album.createdBy || album.createdBy.toString() !== req.user.id) {
    throw new AppError('You are not authorized to manage collaborators for this album.', 403);
  }

  const { email, role } = req.body;
  if (!email || !role) {
    throw new AppError('Email and role are required.', 400);
  }

  if (!['viewer', 'contributor'].includes(role)) {
    throw new AppError('Invalid role specified.', 400);
  }

  // Look up user by email
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  // Prevent adding the owner themselves
  if (album.createdBy.toString() === user._id.toString()) {
    throw new AppError('The owner cannot be added as a collaborator.', 400);
  }

  // Prevent duplicate collaborator
  const duplicate = album.collaborators.find(
    (c) => c.user && c.user.toString() === user._id.toString()
  );
  if (duplicate) {
    throw new AppError('User is already a collaborator on this album.', 400);
  }

  album.collaborators.push({ user: user._id, role });
  await album.save();

  // Populate user details for response
  const populated = await Album.findById(album._id).populate('collaborators.user', 'name email');

  console.log(`🤝 Collaborator ${email} added to album ${album._id}`);
  res.status(200).json({
    message: 'Collaborator added successfully!',
    collaborators: populated.collaborators,
  });
});

/**
 * DELETE /api/albums/:id/collaborators/:userId
 * Owner-only: removes a collaborator by user ID.
 */
const removeCollaborator = wrapAsync(async (req, res) => {
  const album = await Album.findById(req.params.id);
  if (!album) {
    throw new AppError('Album not found.', 404);
  }

  // Owner check
  if (!album.createdBy || album.createdBy.toString() !== req.user.id) {
    throw new AppError('You are not authorized to manage collaborators for this album.', 403);
  }

  const { userId } = req.params;

  album.collaborators = album.collaborators.filter(
    (c) => c.user && c.user.toString() !== userId
  );

  await album.save();

  const populated = await Album.findById(album._id).populate('collaborators.user', 'name email');

  console.log(`🤝 Collaborator ${userId} removed from album ${album._id}`);
  res.status(200).json({
    message: 'Collaborator removed successfully!',
    collaborators: populated.collaborators,
  });
});

/**
 * PATCH /api/albums/:id/collaborators/:userId
 * Owner-only: updates a collaborator's role.
 */
const updateCollaboratorRole = wrapAsync(async (req, res) => {
  const album = await Album.findById(req.params.id);
  if (!album) {
    throw new AppError('Album not found.', 404);
  }

  // Owner check
  if (!album.createdBy || album.createdBy.toString() !== req.user.id) {
    throw new AppError('You are not authorized to manage collaborators for this album.', 403);
  }

  const { userId } = req.params;
  const { role } = req.body;

  if (!role || !['viewer', 'contributor'].includes(role)) {
    throw new AppError('Invalid role specified.', 400);
  }

  const collaborator = album.collaborators.find(
    (c) => c.user && c.user.toString() === userId
  );

  if (!collaborator) {
    throw new AppError('Collaborator not found on this album.', 404);
  }

  collaborator.role = role;
  await album.save();

  const populated = await Album.findById(album._id).populate('collaborators.user', 'name email');

  console.log(`🤝 Collaborator ${userId} role updated to ${role} in album ${album._id}`);
  res.status(200).json({
    message: 'Collaborator role updated successfully!',
    collaborators: populated.collaborators,
  });
});

module.exports = {
  createAlbum,
  getAlbums,
  getAlbumById,
  deleteAlbum,
  restoreAlbum,
  permanentDeleteAlbum,
  addCollaborator,
  removeCollaborator,
  updateCollaboratorRole,
};
