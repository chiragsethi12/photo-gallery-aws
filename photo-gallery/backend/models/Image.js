// models/Image.js - Mongoose schema for Image resources
const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  publicId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  url: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: "",
    trim: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  width: {
    type: Number,
  },
  height: {
    type: Number,
  },
  format: {
    type: String,
  },
  album: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album',
    required: false,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  favoritedBy: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Image', ImageSchema);
