// controllers/commentController.js - Business logic for comment CRUD operations and authorization checks
const Comment = require('../models/Comment');
const Image = require('../models/Image');
const Album = require('../models/Album');
const logActivity = require('../utils/logActivity');
const { AppError, wrapAsync } = require('../middleware/errorHandler');

/**
 * Helper to authorize if user has access to view/comment on an image.
 * A user must have at least viewer access to the image's album,
 * or be the image uploader if it has no album.
 */
const authorizeImageAccess = async (image, userId) => {
  if (image.album) {
    const album = await Album.findById(image.album);
    if (!album) {
      throw new AppError('Associated album not found.', 404);
    }

    const isOwner = album.createdBy && album.createdBy.toString() === userId;
    const isCollaborator = album.collaborators && album.collaborators.some(
      (c) => c.user && c.user.toString() === userId
    );

    if (!isOwner && !isCollaborator) {
      throw new AppError('You do not have permission to access comments on this album image.', 403);
    }
    return album;
  } else {
    const isUploader = image.uploadedBy && image.uploadedBy.toString() === userId;
    if (!isUploader) {
      throw new AppError('You do not have permission to access comments on this private image.', 403);
    }
    return null;
  }
};

/**
 * POST /api/image/:id/comments
 * Adds a new comment on an image.
 */
const addComment = wrapAsync(async (req, res) => {
  const { text } = req.body;
  const imageId = req.params.id;

  if (!text || !text.trim()) {
    throw new AppError('Comment text is required.', 400);
  }

  const image = await Image.findOne({ _id: imageId, isDeleted: { $ne: true } });
  if (!image) {
    throw new AppError('Image not found.', 404);
  }

  const album = await authorizeImageAccess(image, req.user.id);

  const comment = new Comment({
    image: image._id,
    author: req.user.id,
    text: text.trim(),
  });

  const savedComment = await comment.save();
  const populatedComment = await Comment.findById(savedComment._id).populate('author', 'name');

  // Log album activity if the image belongs to an album
  if (image.album && album) {
    logActivity(image.album, req.user.id, 'comment', {
      imageId: image._id,
      imageTitle: image.title,
    });
    const io = req.app.get('io');
    if (io) {
      io.to(`album:${image.album.toString()}`).emit('comment:added', populatedComment);
    }
  }

  const logger = require('../config/logger');
  logger.info(`💬 Comment added by ${req.user.name} on image ${imageId}`);
  res.status(201).json(populatedComment);
});

/**
 * GET /api/image/:id/comments
 * Retrieves paginated comments on an image, newest-first.
 */
const getComments = wrapAsync(async (req, res) => {
  const imageId = req.params.id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const image = await Image.findOne({ _id: imageId, isDeleted: { $ne: true } });
  if (!image) {
    throw new AppError('Image not found.', 404);
  }

  await authorizeImageAccess(image, req.user.id);

  const totalComments = await Comment.countDocuments({ image: imageId });
  const comments = await Comment.find({ image: imageId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'name');

  const totalPages = Math.ceil(totalComments / limit);

  res.status(200).json({
    comments,
    totalPages,
    currentPage: page,
    totalComments,
  });
});

/**
 * DELETE /api/comments/:id
 * Deletes a comment. Authorized if the user is the author of the comment
 * OR if they are the owner of the album containing the commented image.
 */
const deleteComment = wrapAsync(async (req, res) => {
  const commentId = req.params.id;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new AppError('Comment not found.', 404);
  }

  // Find image to resolve album owner permissions check
  const image = await Image.findById(comment.image);
  let isAlbumOwner = false;

  if (image && image.album) {
    const album = await Album.findById(image.album);
    if (album && album.createdBy && album.createdBy.toString() === req.user.id) {
      isAlbumOwner = true;
    }
  }

  const isAuthor = comment.author && comment.author.toString() === req.user.id;

  if (!isAuthor && !isAlbumOwner) {
    throw new AppError('You do not have permission to delete this comment.', 403);
  }

  await Comment.findByIdAndDelete(commentId);

  const logger = require('../config/logger');
  logger.info(`🗑️ Comment ${commentId} deleted by user ${req.user.id}`);
  res.status(200).json({ message: 'Comment deleted successfully!' });
});

module.exports = {
  addComment,
  getComments,
  deleteComment,
};
