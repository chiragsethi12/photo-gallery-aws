// src/hooks/useGallery.js - Custom hook that manages all gallery state and actions
import { useState, useEffect, useCallback } from 'react';
import { fetchImages, deleteImage as apiDeleteImage } from '../api/imageApi';

/**
 * useGallery
 * Encapsulates the gallery's state: images list, loading, error, and handlers.
 * Used by both Gallery and App so they stay in sync.
 */
const useGallery = () => {
  const [images, setImages]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [deleting, setDeleting]   = useState(null); // key of image being deleted

  // ── Load Images ──────────────────────────────────────────────────────────
  const loadImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchImages();
      setImages(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load images. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch images on first render
  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // ── Delete Image ─────────────────────────────────────────────────────────
  const deleteImage = useCallback(async (key) => {
    setDeleting(key);
    setError(null);
    try {
      await apiDeleteImage(key);
      // Remove the deleted image from local state without re-fetching
      setImages((prev) => prev.filter((img) => img.key !== key));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete image.');
    } finally {
      setDeleting(null);
    }
  }, []);

  // ── Add Image (after upload, avoid extra S3 list call) ───────────────────
  const addImage = useCallback((newImage) => {
    setImages((prev) => [newImage, ...prev]);
  }, []);

  return { images, loading, error, deleting, loadImages, deleteImage, addImage };
};

export default useGallery;
