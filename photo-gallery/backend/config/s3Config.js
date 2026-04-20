// config/s3Config.js - AWS S3 client configuration
const { S3Client } = require('@aws-sdk/client-s3');

/**
 * Creates and exports a configured AWS S3 client instance.
 * Credentials are loaded from environment variables for security.
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

module.exports = s3Client;
