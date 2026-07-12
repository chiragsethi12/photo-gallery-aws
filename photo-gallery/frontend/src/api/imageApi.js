// src/api/imageApi.js - Centralized Axios API calls to the backend
import axios from 'axios';

// Base URL of the Express backend
const API_BASE = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

// Interceptor to inject JWT token into header for protected API endpoints
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to refresh access token on 401 unauthorized errors
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401, not already retried, and not the refresh endpoint itself
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      const storedRefreshToken = localStorage.getItem('refreshToken');
      
      if (storedRefreshToken) {
        try {
          // Request token refresh
          const res = await axios.post(`${API_BASE}/auth/refresh`, {
            refreshToken: storedRefreshToken,
          });
          
          const { token: newAccessToken, refreshToken: newRefreshToken } = res.data;
          
          // Update tokens in local storage
          localStorage.setItem('token', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Dispatch event to inform AuthContext of updated tokens
          window.dispatchEvent(
            new CustomEvent('auth:tokens_refreshed', {
              detail: { token: newAccessToken, refreshToken: newRefreshToken },
            })
          );
          
          // Update request header and retry the request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          console.error('Refresh token failed:', refreshError);
          
          // Clear credentials
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          
          // Inform AuthContext to clear local state
          window.dispatchEvent(new CustomEvent('auth:logout'));
          
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Upload a single image file to the backend.
 * Uses multipart/form-data so multer can parse it server-side.
 *
 * @param {File} file - The image file selected by the user
 * @param {object|Function} options - Optional fields like { title, tags, album } OR onUploadProgress function
 * @param {Function} [onUploadProgress] - Optional progress callback (0-100)
 * @returns {Promise<object>} Saved MongoDB Image document
 */
export const uploadImage = async (file, options = {}, onUploadProgress) => {
  let progressCallback = onUploadProgress;
  let opts = options;
  if (typeof options === 'function') {
    progressCallback = options;
    opts = {};
  }

  const formData = new FormData();
  formData.append('image', file);
  if (opts.title) formData.append('title', opts.title);
  if (opts.tags) formData.append('tags', opts.tags);
  if (opts.album) formData.append('album', opts.album);

  const response = await axios.post(`${API_BASE}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (progressCallback && progressEvent.total) {
        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        progressCallback(pct);
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

/**
 * Toggle favorite status on a specific image.
 * @param {string} id - Image ObjectId
 * @returns {Promise<{message, favoritedBy: string[], isFavorited: boolean}>}
 */
export const toggleFavoriteImage = async (id) => {
  const response = await axios.post(`${API_BASE}/image/${id}/favorite`);
  return response.data;
};

/**
 * Fetch all albums.
 * @param {string} scope - Scoped view filtering: 'mine', 'shared', or 'all'.
 * @returns {Promise<Array>} List of albums enriched with cover images and image counts.
 */
export const fetchAlbums = async (scope = 'all') => {
  const response = await axios.get(`${API_BASE}/albums`, { params: { scope } });
  return response.data;
};

/**
 * Create a new album.
 * @param {object} albumData - { name, description, coverImage }
 * @returns {Promise<object>} The saved album document.
 */
export const createAlbum = async (albumData) => {
  const response = await axios.post(`${API_BASE}/albums`, albumData);
  return response.data;
};

/**
 * Fetch a single album by ID.
 */
export const fetchAlbumById = async (id) => {
  const response = await axios.get(`${API_BASE}/albums/${id}`);
  return response.data;
};

/**
 * Fetch current user's active sessions.
 */
export const fetchSessions = async () => {
  const response = await axios.get(`${API_BASE}/auth/sessions`);
  return response.data;
};

/**
 * Revoke a specific session.
 */
export const revokeSession = async (id) => {
  const response = await axios.delete(`${API_BASE}/auth/sessions/${id}`);
  return response.data;
};

/**
 * Fetch current user's trashed items.
 */
export const fetchTrash = async () => {
  const response = await axios.get(`${API_BASE}/trash`);
  return response.data;
};

/**
 * Restore a soft-deleted image.
 */
export const restoreImage = async (id) => {
  const response = await axios.post(`${API_BASE}/image/${id}/restore`);
  return response.data;
};

/**
 * Restore a soft-deleted album.
 */
export const restoreAlbum = async (id) => {
  const response = await axios.post(`${API_BASE}/albums/${id}/restore`);
  return response.data;
};

/**
 * Permanently delete an image.
 */
export const permanentlyDeleteImage = async (id) => {
  const response = await axios.delete(`${API_BASE}/image/${id}/permanent`);
  return response.data;
};

/**
 * Permanently delete an album.
 */
export const permanentlyDeleteAlbum = async (id) => {
  const response = await axios.delete(`${API_BASE}/albums/${id}/permanent`);
  return response.data;
};

/**
 * Add a collaborator to an album.
 */
export const addCollaborator = async (albumId, email, role) => {
  const response = await axios.post(`${API_BASE}/albums/${albumId}/collaborators`, { email, role });
  return response.data;
};

/**
 * Remove a collaborator from an album.
 */
export const removeCollaborator = async (albumId, userId) => {
  const response = await axios.delete(`${API_BASE}/albums/${albumId}/collaborators/${userId}`);
  return response.data;
};

/**
 * Update role of an album collaborator.
 */
export const updateCollaborator = async (albumId, userId, role) => {
  const response = await axios.patch(`${API_BASE}/albums/${albumId}/collaborators/${userId}`, { role });
  return response.data;
};
