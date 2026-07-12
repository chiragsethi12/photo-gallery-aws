// controllers/imageController.js - Business logic for Express backend with MongoDB and Cloudinary
const cloudinary = require('../config/cloudinaryConfig');
const streamifier = require('streamifier');
const mongoose = require('mongoose');
const Image = require('../models/Image');
const Album = require('../models/Album');
const { AppError, wrapAsync } = require('../middleware/errorHandler');

// ─── Upload Image ─────────────────────────────────────────────────────────────

/**
 * POST /api/upload
 * Accepts a multipart/form-data request containing an image file.
 * Uploads the image to Cloudinary, then creates a metadata record in MongoDB.
 * Returns the saved MongoDB document.
 */
const uploadImage = wrapAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file provided. Please select an image.', 400);
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
});

// ─── Get All Images (Query MongoDB) ───────────────────────────────────────────

/**
 * GET /api/images
 * Queries the MongoDB Image collection instead of Cloudinary API.
 * Supports query params: page, limit, tag, album, search.
 * Returns: { images, totalPages, currentPage, totalImages }
 */
const getImages = wrapAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const skip = (page - 1) * limit;

  // Do not retrieve soft-deleted images by default
  const filter = {
    isDeleted: { $ne: true }
  };

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
});

// ─── Delete Image (Cloudinary + MongoDB) ──────────────────────────────────────

/**
 * DELETE /api/image/:publicId(*)
 * Soft deletes an image by marking isDeleted: true and setting deletedAt.
 */
const deleteImage = wrapAsync(async (req, res) => {
  const publicId = decodeURIComponent(req.params.publicId);

  if (!publicId) {
    throw new AppError('Image publicId is required.', 400);
  }

  // Find the image document in DB first to check ownership
  const imageDoc = await Image.findOne({ publicId });
  if (!imageDoc) {
    throw new AppError('Image not found in database.', 404);
  }

  // Check if current user is the owner of the image OR owner of the album containing the image
  let isAuthorized = false;
  if (imageDoc.uploadedBy && imageDoc.uploadedBy.toString() === req.user.id) {
    isAuthorized = true;
  } else if (imageDoc.album) {
    const album = await Album.findById(imageDoc.album);
    if (album && album.createdBy && album.createdBy.toString() === req.user.id) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    throw new AppError('You can only delete your own images', 403);
  }

  // Perform soft delete
  imageDoc.isDeleted = true;
  imageDoc.deletedAt = new Date();
  await imageDoc.save();

  console.log(`🗑️ Image soft-deleted: ${publicId}`);
  res.status(200).json({ message: 'Image soft-deleted successfully!', publicId });
});

/**
 * Reusable helper to permanently delete an image from Cloudinary and MongoDB
 */
const permanentlyDeleteImageRecord = async (publicId) => {
  // 1. Delete from Cloudinary
  try {
    const cloudinaryResult = await cloudinary.uploader.destroy(publicId);
    console.log(`🗑️ Cloudinary destroy result for ${publicId}:`, cloudinaryResult.result);
  } catch (cloudinaryErr) {
    console.error(`❌ Cloudinary delete error for ${publicId}:`, cloudinaryErr.message);
    throw new AppError('Failed to delete from Cloudinary: ' + cloudinaryErr.message, 500);
  }

  // 2. Delete from MongoDB
  try {
    await Image.findOneAndDelete({ publicId });
    console.log(`🗑️ MongoDB document permanently deleted for publicId: ${publicId}`);
  } catch (dbErr) {
    console.error(`❌ MongoDB delete error for ${publicId}:`, dbErr.message);
    throw new AppError('Failed to delete metadata from MongoDB: ' + dbErr.message, 500);
  }
};

/**
 * POST /api/image/:id/restore
 * Restores a soft-deleted image.
 */
const restoreImage = wrapAsync(async (req, res) => {
  const imageDoc = await Image.findById(req.params.id);
  if (!imageDoc) {
    throw new AppError('Image not found.', 404);
  }

  // Check ownership
  if (imageDoc.uploadedBy && imageDoc.uploadedBy.toString() !== req.user.id) {
    throw new AppError('You can only restore your own images', 403);
  }

  imageDoc.isDeleted = false;
  imageDoc.deletedAt = null;
  await imageDoc.save();

  console.log(`🔄 Image restored: ${imageDoc.publicId}`);
  res.status(200).json({ message: 'Image restored successfully!', image: imageDoc });
});

/**
 * DELETE /api/image/:id/permanent
 * Permanently deletes an image from Cloudinary and MongoDB.
 */
const permanentDeleteImage = wrapAsync(async (req, res) => {
  const imageDoc = await Image.findById(req.params.id);
  if (!imageDoc) {
    throw new AppError('Image not found.', 404);
  }

  // Check ownership of the image OR owner of the album containing the image
  let isAuthorized = false;
  if (imageDoc.uploadedBy && imageDoc.uploadedBy.toString() === req.user.id) {
    isAuthorized = true;
  } else if (imageDoc.album) {
    const album = await Album.findById(imageDoc.album);
    if (album && album.createdBy && album.createdBy.toString() === req.user.id) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    throw new AppError('You can only permanently delete your own images', 403);
  }

  await permanentlyDeleteImageRecord(imageDoc.publicId);

  res.status(200).json({ message: 'Image permanently deleted successfully!', id: req.params.id });
});

// ─── Toggle Favorite Image ───────────────────────────────────────────────────

/**
 * POST /api/image/:id/favorite
 * Toggles user ID in the image favoritedBy array.
 */
const toggleFavoriteImage = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid image ID.', 400);
  }

  const image = await Image.findById(id);
  if (!image) {
    throw new AppError('Image not found.', 404);
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
});

module.exports = {
  uploadImage,
  getImages,
  deleteImage,
  toggleFavoriteImage,
  restoreImage,
  permanentDeleteImage,
  permanentlyDeleteImageRecord,
};
