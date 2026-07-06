// controllers/imageController.js - Business logic for Express backend with MongoDB and Cloudinary
const cloudinary = require('../config/cloudinaryConfig');
const streamifier = require('streamifier');
const mongoose = require('mongoose');
const Image = require('../models/Image');

// ─── Upload Image ─────────────────────────────────────────────────────────────

/**
 * POST /api/upload
 * Accepts a multipart/form-data request containing an image file.
 * Uploads the image to Cloudinary, then creates a metadata record in MongoDB.
 * Returns the saved MongoDB document.
 */
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided. Please select an image.' });
    }

    // Wrap the Cloudinary upload stream in a Promise
    const uploadToCloudinary = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'photo-gallery',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
      });
    };

    const result = await uploadToCloudinary(req.file.buffer);
    console.log(`✅ Cloudinary Uploaded: ${result.public_id}`);

    // Parse tags if provided in the body
    let parsedTags = [];
    if (req.body.tags) {
      if (Array.isArray(req.body.tags)) {
        parsedTags = req.body.tags;
      } else if (typeof req.body.tags === 'string') {
        try {
          const parsed = JSON.parse(req.body.tags);
          if (Array.isArray(parsed)) {
            parsedTags = parsed;
          } else {
            parsedTags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
          }
        } catch (e) {
          parsedTags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
        }
      }
    }

    // Validate album ObjectId if provided
    let albumId = undefined;
    if (req.body.album && mongoose.Types.ObjectId.isValid(req.body.album)) {
      albumId = req.body.album;
    }

    // Save image metadata in MongoDB
    const image = new Image({
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      title: req.body.title || '',
      tags: parsedTags,
      album: albumId,
      uploadedBy: req.user.id, // Set automatically from authentication middleware
    });

    const savedImage = await image.save();
    console.log(`💾 Saved metadata to MongoDB: ${savedImage._id}`);

    res.status(200).json(savedImage);
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ error: 'Failed to upload image. ' + error.message });
  }
};

// ─── Get All Images (Query MongoDB) ───────────────────────────────────────────

/**
 * GET /api/images
 * Queries the MongoDB Image collection instead of Cloudinary API.
 * Supports query params: page, limit, tag, album, search.
 * Returns: { images, totalPages, currentPage, totalImages }
 */
const getImages = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = (page - 1) * limit;

    const filter = {};

    // Filter by tag
    if (req.query.tag) {
      filter.tags = req.query.tag;
    }

    // Filter by album id
    if (req.query.album) {
      if (mongoose.Types.ObjectId.isValid(req.query.album)) {
        filter.album = req.query.album;
      }
    }

    // Search by title or tag (case-insensitive match)
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }

    const totalImages = await Image.countDocuments(filter);
    const images = await Image.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalImages / limit);

    res.status(200).json({
      images,
      totalPages,
      currentPage: page,
      totalImages,
    });
  } catch (error) {
    console.error('Fetch images error:', error.message);
    res.status(500).json({ error: 'Failed to fetch images. ' + error.message });
  }
};

// ─── Delete Image (Cloudinary + MongoDB) ──────────────────────────────────────

/**
 * DELETE /api/image/:publicId(*)
 * Deletes from Cloudinary via public_id AND then deletes from MongoDB.
 */
const deleteImage = async (req, res) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId);

    if (!publicId) {
      return res.status(400).json({ error: 'Image publicId is required.' });
    }

    // Find the image document in DB first to check ownership
    const imageDoc = await Image.findOne({ publicId });
    if (!imageDoc) {
      return res.status(404).json({ error: 'Image not found in database.' });
    }

    // Check if current user is the owner
    if (imageDoc.uploadedBy && imageDoc.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own images' });
    }

    // 1. Delete from Cloudinary
    try {
      const cloudinaryResult = await cloudinary.uploader.destroy(publicId);
      console.log(`🗑️ Cloudinary destroy result for ${publicId}:`, cloudinaryResult.result);
    } catch (cloudinaryErr) {
      console.error(`❌ Cloudinary delete error for ${publicId}:`, cloudinaryErr.message);
      return res.status(500).json({ error: 'Failed to delete from Cloudinary: ' + cloudinaryErr.message });
    }

    // 2. Delete from MongoDB
    try {
      const dbResult = await Image.findOneAndDelete({ publicId });
      console.log(`🗑️ MongoDB document deleted for publicId: ${publicId}`);
    } catch (dbErr) {
      console.error(`❌ MongoDB delete error for ${publicId}:`, dbErr.message);
      return res.status(500).json({ error: 'Failed to delete metadata from MongoDB: ' + dbErr.message });
    }

    res.status(200).json({ message: 'Image deleted successfully!', publicId });
  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(500).json({ error: 'Failed to delete image. ' + error.message });
  }
};

// ─── Toggle Favorite Image ───────────────────────────────────────────────────

/**
 * POST /api/image/:id/favorite
 * Toggles user ID in the image favoritedBy array.
 */
const toggleFavoriteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid image ID.' });
    }

    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ error: 'Image not found.' });
    }

    const index = image.favoritedBy.indexOf(userId);
    if (index === -1) {
      image.favoritedBy.push(userId);
    } else {
      image.favoritedBy.splice(index, 1);
    }

    await image.save();
    console.log(`❤️ Toggled favorite for user ${userId} on image ${id}`);

    res.status(200).json({
      message: 'Favorite toggled successfully',
      favoritedBy: image.favoritedBy,
      isFavorited: index === -1,
    });
  } catch (error) {
    console.error('Toggle favorite error:', error.message);
    res.status(500).json({ error: 'Failed to toggle favorite. ' + error.message });
  }
};

module.exports = { uploadImage, getImages, deleteImage, toggleFavoriteImage };
