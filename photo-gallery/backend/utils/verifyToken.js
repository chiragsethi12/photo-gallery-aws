// utils/verifyToken.js - Shared helper to decode and verify JWT payloads
const jwt = require('jsonwebtoken');

/**
 * verifyToken
 * Decodes and verifies a JWT token. Throws if invalid or expired.
 *
 * @param {String} token - Raw JWT string
 * @returns {Object} Decoded payload { id, name, email }
 */
const verifyToken = (token) => {
  if (!token) {
    throw new Error('No token provided.');
  }
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = verifyToken;
