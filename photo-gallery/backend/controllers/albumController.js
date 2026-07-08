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
 * Retrieves all albums, sorted newest first, enriched with cover image and image count.
 */
const getAlbums = wrapAsync(async (req, res) => {
  const albums = await Album.find().sort({ createdAt: -1 });
  
  const enrichedAlbums = await Promise.all(
    albums.map(async (album) => {
      const imageCount = await Image.countDocuments({ album: album._id });
      
      let coverImage = album.coverImage;
      if (!coverImage) {
        const firstImage = await Image.findOne({ album: album._id }).sort({ createdAt: 1 });
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
 * Retrieves a single album by its ID.
 */
const getAlbumById = wrapAsync(async (req, res) => {
  const album = await Album.findById(req.params.id);
  if (!album) {
    throw new AppError('Album not found.', 404);
  }
  
  const imageCount = await Image.countDocuments({ album: album._id });
  let coverImage = album.coverImage;
  if (!coverImage) {
    const firstImage = await Image.findOne({ album: album._id }).sort({ createdAt: 1 });
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
 * Deletes an album by its ID.
 */
const deleteAlbum = wrapAsync(async (req, res) => {
  const album = await Album.findByIdAndDelete(req.params.id);
  if (!album) {
    throw new AppError('Album not found.', 404);
  }
  console.log(`🗑️ Album deleted: ${req.params.id}`);
  res.status(200).json({ message: 'Album deleted successfully!', albumId: req.params.id });
});

module.exports = {
  createAlbum,
  getAlbums,
  getAlbumById,
  deleteAlbum,
};
