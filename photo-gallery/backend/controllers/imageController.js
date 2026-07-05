// controllers/imageController.js - Business logic for Cloudinary image operations
const cloudinary = require('../config/cloudinaryConfig');
const streamifier = require('streamifier');

// ─── Upload Image ─────────────────────────────────────────────────────────────

/**
 * POST /api/upload
 * Accepts a multipart/form-data request containing an image file.
 * Uploads the image to Cloudinary folder "photo-gallery" and returns metadata.
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

    console.log(`✅ Uploaded: ${result.public_id}`);

    res.status(200).json({
      message: 'Image uploaded successfully!',
      secure_url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      // Provide camelCase mappings to make it easy for frontend
      publicId: result.public_id,
      url: result.secure_url,
    });
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ error: 'Failed to upload image. ' + error.message });
  }
};

// ─── Get All Images ───────────────────────────────────────────────────────────

/**
 * GET /api/images
 * Lists all resources stored under the "photo-gallery" prefix in Cloudinary.
 * Returns an array of { publicId, url, width, height, format, createdAt } objects.
 */
const getImages = async (req, res) => {
  try {
    const response = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'photo-gallery/',
      max_results: 100,
    });

    const images = (response.resources || []).map((resource) => ({
      publicId: resource.public_id,
      url: resource.secure_url,
      width: resource.width,
      height: resource.height,
      format: resource.format,
      createdAt: resource.created_at,
    }));

    // Sort newest first
    images.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ images });
  } catch (error) {
    console.error('Fetch images error:', error.message);
    res.status(500).json({ error: 'Failed to fetch images. ' + error.message });
  }
};

// ─── Delete Image ─────────────────────────────────────────────────────────────

/**
 * DELETE /api/image/:publicId(*)
 * Deletes a specific resource from Cloudinary by its publicId.
 */
const deleteImage = async (req, res) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId);

    if (!publicId) {
      return res.status(400).json({ error: 'Image publicId is required.' });
    }

    const result = await cloudinary.uploader.destroy(publicId);

    console.log(`🗑️  Deleted: ${publicId}, result: ${result.result}`);
    res.status(200).json({ message: 'Image deleted successfully!', publicId });
  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(500).json({ error: 'Failed to delete image. ' + error.message });
  }
};

module.exports = { uploadImage, getImages, deleteImage };
