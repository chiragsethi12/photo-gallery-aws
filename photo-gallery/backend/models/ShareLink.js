// models/ShareLink.js - Schema for temporary or password-locked public resource access links
const mongoose = require('mongoose');

const shareLinkSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  resourceType: {
    type: String,
    enum: ['album', 'image'],
    required: true,
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  passwordHash: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  revokedAt: {
    type: Date,
    default: null,
  },
});

// Set indexes for performance and expiration queries
shareLinkSchema.index({ expiresAt: 1 });

const ShareLink = mongoose.model('ShareLink', shareLinkSchema);

module.exports = ShareLink;
