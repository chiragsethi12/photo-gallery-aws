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
 * Fetch images with pagination and optional filters.
 * @param {number|object} page - The page number or an object containing query options
 * @param {number} limit - Number of images per page
 * @param {string} tag - Tag filter
 * @param {string} album - Album ID filter
 * @param {string} search - Search query on title
 * @returns {Promise<{images: Array, totalPages: number, currentPage: number, totalImages: number}>}
 */
export const fetchImages = async (page = 1, limit = 12, tag = '', album = '', search = '') => {
  const params = {};
  if (typeof page === 'object' && page !== null) {
    Object.assign(params, page);
  } else {
    params.page = page;
    params.limit = limit;
    if (tag) params.tag = tag;
    if (album) params.album = album;
    if (search) params.search = search;
  }
  const response = await axios.get(`${API_BASE}/images`, { params });
  return response.data;
};

/**
 * Delete an image from Cloudinary by its publicId.
 * The publicId is URL-encoded to safely handle slashes in it.
 *
 * @param {string} publicId - Cloudinary public ID (e.g. "photo-gallery/uuid")
 * @returns {Promise<{message, publicId}>}
 */
export const deleteImage = async (publicId) => {
  const encodedPublicId = encodeURIComponent(publicId);
  const response = await axios.delete(`${API_BASE}/image/${encodedPublicId}`);
  return response.data;
};
