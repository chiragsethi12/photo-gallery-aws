// controllers/shareController.js - Business logic for generating, resolving, and revoking public share links
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const ShareLink = require('../models/ShareLink');
const Album = require('../models/Album');
const Image = require('../models/Image');
const { AppError, wrapAsync } = require('../middleware/errorHandler');

/**
 * POST /api/share
 * Generates a shareable link token for a resource (album or image).
 * Optional expiry and optional password.
 */
const createShareLink = wrapAsync(async (req, res) => {
  const { resourceType, resourceId, expiresInDays, password } = req.body;

  if (!resourceType || !resourceId) {
    throw new AppError('Resource type and resource ID are required.', 400);
  }

  if (!['album', 'image'].includes(resourceType)) {
    throw new AppError('Invalid resource type.', 400);
  }

  // ── Authorize Access to Resource ──────────────────────────────────────────
  if (resourceType === 'album') {
    const album = await Album.findOne({ _id: resourceId, isDeleted: { $ne: true } });
    if (!album) {
      throw new AppError('Album not found.', 404);
    }

    // Owner checks
    const isOwner = album.createdBy && album.createdBy.toString() === req.user.id;
    // Collaborator checks
    const isCollaborator = album.collaborators && album.collaborators.some(
      (c) => c.user && c.user.toString() === req.user.id
    );

    if (!isOwner && !isCollaborator) {
      throw new AppError('You do not have permission to share this album.', 403);
    }
  } else if (resourceType === 'image') {
    const image = await Image.findOne({ _id: resourceId, isDeleted: { $ne: true } });
    if (!image) {
      throw new AppError('Image not found.', 404);
    }

    const isUploader = image.uploadedBy && image.uploadedBy.toString() === req.user.id;
    let isAlbumViewer = false;

    if (!isUploader && image.album) {
      const album = await Album.findOne({ _id: image.album, isDeleted: { $ne: true } });
      if (album) {
        const isOwner = album.createdBy && album.createdBy.toString() === req.user.id;
        const isCollaborator = album.collaborators && album.collaborators.some(
          (c) => c.user && c.user.toString() === req.user.id
        );
        isAlbumViewer = isOwner || isCollaborator;
      }
    }

    if (!isUploader && !isAlbumViewer) {
      throw new AppError('You do not have permission to share this image.', 403);
    }
  }

  // ── Generate Token & Expiration ──────────────────────────────────────────
  const token = crypto.randomBytes(32).toString('hex');

  let expiresAt = null;
  if (expiresInDays) {
    const days = parseFloat(expiresInDays);
    if (days > 0) {
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }
  }

  // ── Hash Password if provided ────────────────────────────────────────────
  let passwordHash = null;
  if (password) {
    passwordHash = await bcrypt.hash(password, 10);
  }

  // Save the share link record
  const shareLink = new ShareLink({
    token,
    resourceType,
    resourceId,
    createdBy: req.user.id,
    expiresAt,
    passwordHash,
  });

  await shareLink.save();

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const url = `${frontendUrl}/share/${token}`;

  console.log(`🔗 Share link generated for ${resourceType} ${resourceId}: ${token}`);
  res.status(201).json({
    token,
    resourceType,
    resourceId,
    expiresAt,
    url,
  });
});

/**
 * GET /api/share/:token
 * Public endpoint to resolve a share link.
 * Requires password if configured. Returns public-safe details.
 */
const resolveShareLink = wrapAsync(async (req, res) => {
  const { token } = req.params;
  const password = req.query.password || req.body.password;

  const shareLink = await ShareLink.findOne({ token });
  if (!shareLink || shareLink.revokedAt) {
    throw new AppError('This link is no longer available', 404);
  }

  // Check expiration
  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
    throw new AppError('This link is no longer available', 404);
  }

  // Password verification
  if (shareLink.passwordHash) {
    if (!password) {
      return res.status(401).json({ requiresPassword: true });
    }
    const isMatch = await bcrypt.compare(password, shareLink.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ requiresPassword: true, error: 'Incorrect password.' });
    }
  }

  // ── Retrieve Public-Safe Resource ─────────────────────────────────────────
  if (shareLink.resourceType === 'album') {
    const album = await Album.findOne({ _id: shareLink.resourceId, isDeleted: { $ne: true } });
    if (!album) {
      throw new AppError('This link is no longer available', 404);
    }

    // Fetch images belonging to this album
    const images = await Image.find({ album: album._id, isDeleted: { $ne: true } }).sort({ createdAt: -1 });

    // Format safe response (exclude user credentials, collaborator emails, etc.)
    const safeAlbum = {
      _id: album._id,
      name: album.name,
      description: album.description,
      coverImage: album.coverImage,
      createdAt: album.createdAt,
    };

    const safeImages = images.map((img) => ({
      _id: img._id,
      publicId: img.publicId,
      url: img.url,
      width: img.width,
      height: img.height,
      format: img.format,
      title: img.title,
      tags: img.tags,
      createdAt: img.createdAt,
    }));

    res.status(200).json({
      resourceType: 'album',
      album: safeAlbum,
      images: safeImages,
    });
  } else if (shareLink.resourceType === 'image') {
    const image = await Image.findOne({ _id: shareLink.resourceId, isDeleted: { $ne: true } });
    if (!image) {
      throw new AppError('This link is no longer available', 404);
    }

    const safeImage = {
      _id: image._id,
      publicId: image.publicId,
      url: image.url,
      width: image.width,
      height: image.height,
      format: image.format,
      title: image.title,
      tags: image.tags,
      createdAt: image.createdAt,
    };

    res.status(200).json({
      resourceType: 'image',
      image: safeImage,
    });
  }
});

/**
 * DELETE /api/share/:token
 * Revokes a shareable link (Protected - Link creator only).
 */
const revokeShareLink = wrapAsync(async (req, res) => {
  const { token } = req.params;

  const shareLink = await ShareLink.findOne({ token });
  if (!shareLink) {
    throw new AppError('Share link not found.', 404);
  }

  // Revoke permission: link creator only
  if (shareLink.createdBy.toString() !== req.user.id) {
    throw new AppError('You are not authorized to revoke this link.', 403);
  }

  shareLink.revokedAt = new Date();
  await shareLink.save();

  console.log(`🚫 Share link revoked: ${token}`);
  res.status(200).json({ message: 'Share link revoked successfully!' });
});

module.exports = {
  createShareLink,
  resolveShareLink,
  revokeShareLink,
};
