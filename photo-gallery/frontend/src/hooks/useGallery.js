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
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalImages, setTotalImages] = useState(0);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [deleting, setDeleting]   = useState(null); // publicId of image being deleted

  // ── Load Images ──────────────────────────────────────────────────────────
  const loadImages = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchImages({ page });
      setImages(data.images || []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || 1);
      setTotalImages(data.totalImages || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load images. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch images on first render
  useEffect(() => {
    loadImages(1);
  }, [loadImages]);

  // ── Delete Image ─────────────────────────────────────────────────────────
  const deleteImage = useCallback(async (publicId) => {
    setDeleting(publicId);
    setError(null);
    try {
      await apiDeleteImage(publicId);
      // Remove the deleted image from local state without re-fetching
      setImages((prev) => prev.filter((img) => img.publicId !== publicId));
      setTotalImages((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete image.');
    } finally {
      setDeleting(null);
    }
  }, []);

  // ── Add Image (after upload, avoid extra list call) ───────────────────
  const addImage = useCallback((newImage) => {
    setImages((prev) => [newImage, ...prev]);
    setTotalImages((prev) => prev + 1);
  }, []);

  return {
    images,
    loading,
    error,
    deleting,
    totalPages,
    currentPage,
    totalImages,
    loadImages,
    deleteImage,
    addImage,
  };
};

export default useGallery;
