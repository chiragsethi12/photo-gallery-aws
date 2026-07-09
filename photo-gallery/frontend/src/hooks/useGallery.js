// src/hooks/useGallery.js - Custom hook that manages all gallery state, filters, and actions
import { useState, useEffect, useCallback } from 'react';
import { 
  fetchImages, 
  deleteImage as apiDeleteImage, 
  fetchAlbums as apiFetchAlbums,
  toggleFavoriteImage as apiToggleFavorite,
  fetchTrash as apiFetchTrash,
  restoreImage as apiRestoreImage,
  restoreAlbum as apiRestoreAlbum,
  permanentlyDeleteImage as apiPermanentlyDeleteImage,
  permanentlyDeleteAlbum as apiPermanentlyDeleteAlbum
} from '../api/imageApi';

/**
 * useGallery
 * Encapsulates the gallery's state: images list, pagination, active filters, loading, and actions.
 */
const useGallery = () => {
  const [images, setImages]       = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalImages, setTotalImages] = useState(0);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [deleting, setDeleting]   = useState(null); // publicId of image being deleted

  // ── Filter States ──────────────────────────────────────────────────────────
  const [selectedAlbum, setSelectedAlbum] = useState('');
  const [selectedTag, setSelectedTag]     = useState('');
  const [searchQuery, setSearchQuery]     = useState('');

  // ── Album States ───────────────────────────────────────────────────────────
  const [albums, setAlbums]             = useState([]);
  const [albumsLoading, setAlbumsLoading] = useState(false);

  // ── Trash States ───────────────────────────────────────────────────────────
  const [trashImages, setTrashImages] = useState([]);
  const [trashAlbums, setTrashAlbums] = useState([]);
  const [trashLoading, setTrashLoading] = useState(false);

  // ── Load Images ──────────────────────────────────────────────────────────
  const loadImages = useCallback(async (page = 1, album = selectedAlbum, tag = selectedTag, search = searchQuery) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchImages({
        page,
        album,
        tag,
        search
      });
      setImages(data.images || []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || 1);
      setTotalImages(data.totalImages || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load images.');
    } finally {
      setLoading(false);
    }
  }, [selectedAlbum, selectedTag, searchQuery]);

  // Load initial images
  useEffect(() => {
    loadImages(1, '', '', '');
  }, [loadImages]);

  // ── Fetch Albums ──────────────────────────────────────────────────────────
  const loadAlbums = useCallback(async () => {
    setAlbumsLoading(true);
    try {
      const data = await apiFetchAlbums();
      setAlbums(data || []);
    } catch (err) {
      console.error('Failed to load albums:', err);
    } finally {
      setAlbumsLoading(false);
    }
  }, []);

  // ── Filter Helpers ────────────────────────────────────────────────────────
  const filterByAlbum = useCallback((albumId) => {
    setSelectedAlbum(albumId);
    setSelectedTag(''); // Clear tag when switching albums
    loadImages(1, albumId, '', searchQuery);
  }, [searchQuery, loadImages]);

  const filterByTag = useCallback((tag) => {
    setSelectedTag(tag);
    loadImages(1, selectedAlbum, tag, searchQuery);
  }, [selectedAlbum, searchQuery, loadImages]);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    loadImages(1, selectedAlbum, selectedTag, query);
  }, [selectedAlbum, selectedTag, loadImages]);

  // ── Delete Image ─────────────────────────────────────────────────────────
  const deleteImage = useCallback(async (publicId) => {
    setDeleting(publicId);
    setError(null);
    try {
      await apiDeleteImage(publicId);
      // Remove the deleted image from local state without re-fetching
      setImages((prev) => prev.filter((img) => img.publicId !== publicId));
      setTotalImages((prev) => Math.max(0, prev - 1));
      // Refresh albums counts
      loadAlbums();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete image.');
    } finally {
      setDeleting(null);
    }
  }, [loadAlbums]);

  // ── Fetch Trash ──────────────────────────────────────────────────────────
  const loadTrash = useCallback(async () => {
    setTrashLoading(true);
    try {
      const data = await apiFetchTrash();
      setTrashImages(data.images || []);
      setTrashAlbums(data.albums || []);
    } catch (err) {
      console.error('Failed to load trash:', err);
    } finally {
      setTrashLoading(false);
    }
  }, []);

  // ── Restore Image ────────────────────────────────────────────────────────
  const restoreImage = useCallback(async (id) => {
    try {
      const data = await apiRestoreImage(id);
      // Remove from trash list state
      setTrashImages((prev) => prev.filter((img) => img._id !== id));
      // Re-add to local active images state
      if (data.image) {
        setImages((prev) => [data.image, ...prev]);
        setTotalImages((prev) => prev + 1);
      }
      loadAlbums();
    } catch (err) {
      console.error('Failed to restore image:', err);
      throw err;
    }
  }, [loadAlbums]);

  // ── Restore Album ────────────────────────────────────────────────────────
  const restoreAlbum = useCallback(async (id) => {
    try {
      await apiRestoreAlbum(id);
      // Remove from trash list state
      setTrashAlbums((prev) => prev.filter((alb) => alb._id !== id));
      loadAlbums();
    } catch (err) {
      console.error('Failed to restore album:', err);
      throw err;
    }
  }, [loadAlbums]);

  // ── Permanently Delete Image ─────────────────────────────────────────────
  const permanentlyDeleteImage = useCallback(async (id) => {
    try {
      await apiPermanentlyDeleteImage(id);
      setTrashImages((prev) => prev.filter((img) => img._id !== id));
    } catch (err) {
      console.error('Failed to permanently delete image:', err);
      throw err;
    }
  }, []);

  // ── Permanently Delete Album ─────────────────────────────────────────────
  const permanentlyDeleteAlbum = useCallback(async (id) => {
    try {
      await apiPermanentlyDeleteAlbum(id);
      setTrashAlbums((prev) => prev.filter((alb) => alb._id !== id));
    } catch (err) {
      console.error('Failed to permanently delete album:', err);
      throw err;
    }
  }, []);

  // ── Toggle Favorite (Optimistic UI Update) ────────────────────────────────
  const toggleFavorite = useCallback(async (imageId, currentUser) => {
    if (!currentUser) return;

    // Apply local state updates optimistically
    setImages((prev) =>
      prev.map((img) => {
        if (img._id === imageId) {
          const favoritedBy = [...(img.favoritedBy || [])];
          const userIdx = favoritedBy.indexOf(currentUser.id);
          if (userIdx === -1) {
            favoritedBy.push(currentUser.id);
          } else {
            favoritedBy.splice(userIdx, 1);
          }
          return { ...img, favoritedBy };
        }
        return img;
      })
    );

    try {
      await apiToggleFavorite(imageId);
    } catch (err) {
      console.error('Failed to toggle favorite on server:', err);
      // Fetch latest images to synchronize state on error
      loadImages(currentPage);
    }
  }, [currentPage, loadImages]);

  // ── Add Image ────────────────────────────────────────────────────────────
  const addImage = useCallback((newImage) => {
    setImages((prev) => [newImage, ...prev]);
    setTotalImages((prev) => prev + 1);
    // Refresh album lists in case a new cover image or counts changed
    loadAlbums();
  }, [loadAlbums]);

  return {
    images,
    loading,
    error,
    deleting,
    totalPages,
    currentPage,
    totalImages,
    selectedAlbum,
    selectedTag,
    searchQuery,
    albums,
    albumsLoading,
    trashImages,
    trashAlbums,
    trashLoading,
    loadImages,
    loadAlbums,
    filterByAlbum,
    filterByTag,
    handleSearch,
    deleteImage,
    loadTrash,
    restoreImage,
    restoreAlbum,
    permanentlyDeleteImage,
    permanentlyDeleteAlbum,
    toggleFavorite,
    addImage,
  };
};

export default useGallery;
