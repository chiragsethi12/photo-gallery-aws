// config/cloudinaryConfig.js
// How to get free Cloudinary credentials:
// 1. Sign up at https://cloudinary.com
// 2. Once logged in, your credentials (Cloud Name, API Key, and API Secret) will be displayed on the dashboard homepage.
// 3. Copy these credentials into your .env file as CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
