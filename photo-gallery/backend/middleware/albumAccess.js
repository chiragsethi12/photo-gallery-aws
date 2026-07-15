// middleware/albumAccess.js - Middleware enforcing permissions on album actions by utilizing shared checkAlbumAccess helper
const checkAlbumAccess = require('../utils/checkAlbumAccess');
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

    try {
      const { album, role } = await checkAlbumAccess(albumId, req.user.id, minRole);
      req.albumRole = role;
      req.album = album;
      return next();
    } catch (err) {
      if (err.status) {
        return next(new AppError(err.message, err.status));
      }
      return next(err);
    }
  };
};

module.exports = { requireAlbumRole };
