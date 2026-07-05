// middleware/upload.js - Multer configuration for handling file uploads
const multer = require('multer');

/**
 * Use memory storage so the file buffer is available in req.file.buffer.
 * This avoids writing temp files to disk before uploading to Cloudinary.
 */
const storage = multer.memoryStorage();

/**
 * File filter: allow only JPEG and PNG images.
 * Rejects any other file type with a clear error message.
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // accept the file
  } else {
    cb(new Error('Only JPEG and PNG images are allowed!'), false);
  }
};

/**
 * Multer instance with:
 * - Memory storage (no disk writes)
 * - Max file size: 10 MB
 * - Only JPEG / PNG accepted
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

module.exports = upload;
