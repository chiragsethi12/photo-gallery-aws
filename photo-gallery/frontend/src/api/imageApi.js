// src/api/imageApi.js - Centralized Axios API calls to the backend
import axios from 'axios';

// Base URL of the Express backend
const API_BASE = 'http://localhost:5000/api';

/**
 * Upload a single image file to the backend.
 * Uses multipart/form-data so multer can parse it server-side.
 *
 * @param {File} file - The image file selected by the user
 * @param {Function} onUploadProgress - Optional progress callback (0-100)
 * @returns {Promise<{key, url, message}>}
 */
export const uploadImage = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('image', file); // 'image' must match the multer field name

  const response = await axios.post(`${API_BASE}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(pct);
      }
    },
  });

  return response.data;
};

/**
 * Fetch all images stored in S3.
 * @returns {Promise<Array<{key, url, lastModified, size}>>}
 */
export const fetchImages = async () => {
  const response = await axios.get(`${API_BASE}/images`);
  return response.data.images;
};

/**
 * Delete an image from S3 by its key.
 * The key is URL-encoded to safely handle slashes in it.
 *
 * @param {string} key - S3 object key (e.g. "photos/uuid.jpg")
 * @returns {Promise<{message, key}>}
 */
export const deleteImage = async (key) => {
  const encodedKey = encodeURIComponent(key);
  const response = await axios.delete(`${API_BASE}/image/${encodedKey}`);
  return response.data;
};
