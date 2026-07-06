// controllers/albumController.js - CRUD operations for Album models
const Album = require('../models/Album');

/**
 * POST /api/albums
 * Creates a new album with name, description, coverImage URL, and optional creator.
 */
const createAlbum = async (req, res) => {
  try {
    const { name, description, coverImage, createdBy } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Album name is required.' });
    }

    const album = new Album({
      name,
      description,
      coverImage,
      createdBy,
    });

    const savedAlbum = await album.save();
    console.log(`✅ Album created: ${savedAlbum._id}`);
    res.status(201).json(savedAlbum);
  } catch (error) {
    console.error('Create album error:', error.message);
    res.status(500).json({ error: 'Failed to create album. ' + error.message });
  }
};

/**
 * GET /api/albums
 * Retrieves all albums, sorted newest first.
 */
const getAlbums = async (req, res) => {
  try {
    const albums = await Album.find().sort({ createdAt: -1 });
    res.status(200).json(albums);
  } catch (error) {
    console.error('Get albums error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve albums. ' + error.message });
  }
};

/**
 * GET /api/albums/:id
 * Retrieves a single album by its ID.
 */
const getAlbumById = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ error: 'Album not found.' });
    }
    res.status(200).json(album);
  } catch (error) {
    console.error('Get album by ID error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve album. ' + error.message });
  }
};

/**
 * DELETE /api/albums/:id
 * Deletes an album by its ID.
 */
const deleteAlbum = async (req, res) => {
  try {
    const album = await Album.findByIdAndDelete(req.params.id);
    if (!album) {
      return res.status(404).json({ error: 'Album not found.' });
    }
    console.log(`🗑️ Album deleted: ${req.params.id}`);
    res.status(200).json({ message: 'Album deleted successfully!', albumId: req.params.id });
  } catch (error) {
    console.error('Delete album error:', error.message);
    res.status(500).json({ error: 'Failed to delete album. ' + error.message });
  }
};

module.exports = {
  createAlbum,
  getAlbums,
  getAlbumById,
  deleteAlbum,
};
