// middleware/albumAccess.js - Middleware to verify user roles/permissions on albums
const Album = require('../models/Album');
const { AppError } = require('./errorHandler');

/**
 * requireAlbumRole
 * Middleware factory that enforces minimum user permissions on an album.
 * @param {String} minRole - 'viewer' or 'contributor'
 * @param {String} idParamSource - 'params' (reads req.params.id), 'body' (reads req.body.album), or 'query' (reads req.query.album)
 */
const requireAlbumRole = (minRole, idParamSource = 'params') => {
  return async (req, res, next) => {
    let albumId;

    if (idParamSource === 'body') {
      albumId = req.body && req.body.album;
      // If no album is specified in the upload/write body, skip checking
      if (!albumId) {
        return next();
      }
    } else if (idParamSource === 'query') {
      albumId = req.query && req.query.album;
      // If no album query parameter is specified, skip checking
      if (!albumId) {
        return next();
      }
    } else {
      albumId = req.params[idParamSource || 'id'];
    }

    if (!albumId) {
      return next(new AppError('Album ID is required.', 400));
    }

    try {
      const album = await Album.findOne({ _id: albumId, isDeleted: { $ne: true } });
      if (!album) {
        return next(new AppError('Album not found.', 404));
      }

      // Check ownership: Owner has all roles/permissions
      if (album.createdBy && album.createdBy.toString() === req.user.id) {
        req.albumRole = 'owner';
        req.album = album;
        return next();
      }

      // Check collaborator access
      const collaborator = album.collaborators.find(
        (c) => c.user && c.user.toString() === req.user.id
      );

      if (!collaborator) {
        return next(new AppError('You do not have access to this album.', 403));
      }

      const roles = ['viewer', 'contributor'];
      const minRoleIndex = roles.indexOf(minRole);
      const userRoleIndex = roles.indexOf(collaborator.role);

      if (userRoleIndex < minRoleIndex) {
        return next(new AppError(`You do not have the required permissions (${minRole}) to perform this action.`, 403));
      }

      req.albumRole = collaborator.role;
      req.album = album;
      return next();
    } catch (err) {
      return next(err);
    }
  };
};

module.exports = { requireAlbumRole };
