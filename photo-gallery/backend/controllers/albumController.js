// controllers/albumController.js - CRUD operations for Album models
const Album = require('../models/Album');
const Image = require('../models/Image');
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
 * Retrieves all non-deleted albums, sorted newest first, enriched with cover image and image count.
 */
const getAlbums = wrapAsync(async (req, res) => {
  const albums = await Album.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
  
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
  const album = await Album.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!album) {
    throw new AppError('Album not found.', 404);
  }
  
  const imageCount = await Image.countDocuments({ album: album._id, isDeleted: { $ne: true } });
  let coverImage = album.coverImage;
  if (!coverImage) {
    const firstImage = await Image.findOne({ album: album._id, isDeleted: { $ne: true } }).sort({ createdAt: 1 });
    if (firstImage) {
      coverImage = firstImage.url;
    }
  }

  res.status(200).json({
    ...album.toObject(),
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

module.exports = {
  createAlbum,
  getAlbums,
  getAlbumById,
  deleteAlbum,
  restoreAlbum,
  permanentDeleteAlbum,
};
