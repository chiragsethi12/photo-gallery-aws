// utils/checkAlbumAccess.js - Shared helper to verify collaborator/owner permission level on an album
const Album = require('../models/Album');

/**
 * checkAlbumAccess
 * Validates a user's role on an album. Returns the album and role on success,
 * or throws an error with status.
 *
 * @param {String} albumId - Album ObjectId
 * @param {String} userId - User ObjectId
 * @param {String} minRole - 'viewer' or 'contributor'
 * @returns {Promise<Object>} { album, role }
 */
const checkAlbumAccess = async (albumId, userId, minRole = 'viewer') => {
  if (!albumId) {
    const err = new Error('Album ID is required.');
    err.status = 400;
    throw err;
  }

  const album = await Album.findOne({ _id: albumId, isDeleted: { $ne: true } });
  if (!album) {
    const err = new Error('Album not found.');
    err.status = 404;
    throw err;
  }

  const userIdStr = userId ? userId.toString() : '';

  // Check ownership
  if (album.createdBy && album.createdBy.toString() === userIdStr) {
    return { album, role: 'owner' };
  }

  // Check collaborator access
  const collaborator = album.collaborators.find(
    (c) => c.user && c.user.toString() === userIdStr
  );

  if (!collaborator) {
    const err = new Error('You do not have access to this album.');
    err.status = 403;
    throw err;
  }

  const roles = ['viewer', 'contributor'];
  const minRoleIndex = roles.indexOf(minRole);
  const userRoleIndex = roles.indexOf(collaborator.role);

  if (userRoleIndex < minRoleIndex) {
    const err = new Error(`You do not have the required permissions (${minRole}) to perform this action.`);
    err.status = 403;
    throw err;
  }

  return { album, role: collaborator.role };
};

module.exports = checkAlbumAccess;
