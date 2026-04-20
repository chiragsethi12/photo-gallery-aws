// controllers/imageController.js - Business logic for S3 image operations
const {
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const s3Client = require('../config/s3Config');

const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const REGION = process.env.AWS_REGION || 'ap-south-1';

// ─── Upload Image ─────────────────────────────────────────────────────────────

/**
 * POST /api/upload
 * Accepts a multipart/form-data request containing an image file.
 * Uploads the image to S3 and returns its public URL.
 */
const uploadImage = async (req, res) => {
  try {
    // multer puts the file info in req.file
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided. Please select an image.' });
    }

    // Generate a unique key so filenames never collide in S3
    const fileExtension = req.file.originalname.split('.').pop();
    const uniqueKey = `photos/${uuidv4()}.${fileExtension}`;

    // Build the S3 upload command
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: uniqueKey,
      Body: req.file.buffer,       // file data from memory storage
      ContentType: req.file.mimetype,
    };

    // Execute the upload
    await s3Client.send(new PutObjectCommand(uploadParams));

    // Construct the public URL of the uploaded image
    // Note: The S3 bucket must have public-read ACLs or a bucket policy for this to work.
    const imageUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${uniqueKey}`;

    console.log(`✅ Uploaded: ${uniqueKey}`);

    res.status(200).json({
      message: 'Image uploaded successfully!',
      key: uniqueKey,
      url: imageUrl,
    });
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ error: 'Failed to upload image. ' + error.message });
  }
};

// ─── Get All Images ───────────────────────────────────────────────────────────

/**
 * GET /api/images
 * Lists all objects stored under the "photos/" prefix in S3.
 * Returns an array of { key, url, lastModified } objects.
 */
const getImages = async (req, res) => {
  try {
    const listParams = {
      Bucket: BUCKET_NAME,
      Prefix: 'photos/', // only fetch images we uploaded
    };

    const data = await s3Client.send(new ListObjectsV2Command(listParams));

    // Map S3 objects to a simpler shape for the frontend
    const images = (data.Contents || []).map((item) => ({
      key: item.Key,
      url: `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${item.Key}`,
      lastModified: item.LastModified,
      size: item.Size,
    }));

    // Sort newest first
    images.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    res.status(200).json({ images });
  } catch (error) {
    console.error('Fetch images error:', error.message);
    res.status(500).json({ error: 'Failed to fetch images. ' + error.message });
  }
};

// ─── Delete Image ─────────────────────────────────────────────────────────────

/**
 * DELETE /api/image/:key
 * Deletes a specific object from S3 by its key.
 * The key is URL-encoded in the route param, so we decode it first.
 */
const deleteImage = async (req, res) => {
  try {
    // The key may contain slashes (e.g. "photos/uuid.jpg"), so we use a wildcard param
    const key = decodeURIComponent(req.params.key);

    if (!key) {
      return res.status(400).json({ error: 'Image key is required.' });
    }

    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    await s3Client.send(new DeleteObjectCommand(deleteParams));

    console.log(`🗑️  Deleted: ${key}`);
    res.status(200).json({ message: 'Image deleted successfully!', key });
  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(500).json({ error: 'Failed to delete image. ' + error.message });
  }
};

module.exports = { uploadImage, getImages, deleteImage };
