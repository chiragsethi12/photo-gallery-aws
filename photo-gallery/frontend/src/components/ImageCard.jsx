// src/components/ImageCard.jsx - Individual gallery card with likes, download, and tags
import React, { useState } from 'react';

/**
 * ImageCard
 * Props:
 *   image          - { _id, publicId, url, title, tags, createdAt, width, height, format, favoritedBy }
 *   onDelete       - callback(publicId)
 *   deleting       - boolean
 *   onClick        - callback to open Lightbox
 *   currentUser    - Active user object
 *   toggleFavorite - callback(imageId, user)
 *   onTagClick     - callback(tag)
 */
const ImageCard = ({
  image,
  onDelete,
  deleting,
  onClick,
  currentUser,
  toggleFavorite,
  onTagClick,
  activeAlbumRole = null,
  onShare = null,
}) => {
  const [loaded, setLoaded]       = useState(false);
  const [imgError, setImgError]   = useState(false);
  const [confirming, setConfirming] = useState(false);

  const canDelete = currentUser && (
    (
      (image.uploadedBy && (image.uploadedBy === currentUser.id || (image.uploadedBy._id && image.uploadedBy._id === currentUser.id))) ||
      activeAlbumRole === 'owner'
    ) &&
    activeAlbumRole !== 'viewer'
  );

  const isFavorited = image.favoritedBy && currentUser && (
    image.favoritedBy.includes(currentUser.id) ||
    image.favoritedBy.some(id => id === currentUser.id || id._id === currentUser.id)
  );

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch { return '—'; }
  };

  const filename = image.publicId?.split('/').pop() || 'image';

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (!confirming) { setConfirming(true); return; }
    onDelete(image.publicId);
    setConfirming(false);
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setConfirming(false);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (toggleFavorite) {
      toggleFavorite(image._id, currentUser);
    }
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = getDownloadUrl(image.url);
    link.download = image.title || filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to generate a fast, optimized thumbnail using Cloudinary URL transformations
  const getThumbnailUrl = (url) => {
    if (!url) return '';
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/w_400,q_auto,f_auto/');
    }
    return url;
  };

  // Helper to generate a download URL that forces Cloudinary attachment download
  const getDownloadUrl = (url) => {
    if (!url) return '';
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/fl_attachment/');
    }
    return url;
  };

  return (
    <div 
      className="group relative cursor-pointer rounded-2xl overflow-hidden bg-white/3 border border-white/5 shadow-xl shadow-black/30 animate-fade-in hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10"
      onClick={onClick}
    >

      {/* ── Skeleton while loading ──────────────────────────────────────── */}
      {!loaded && !imgError && (
        <div className="skeleton aspect-square w-full" />
      )}

      {/* ── Error placeholder ───────────────────────────────────────────── */}
      {imgError && (
        <div className="aspect-square w-full flex flex-col items-center justify-center gap-2 bg-white/3 text-slate-500 text-sm">
          <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>Failed to load</span>
        </div>
      )}

      {/* ── Actual image ─────────────────────────────────────────────────── */}
      <img
        src={getThumbnailUrl(image.url)}
        alt={image.title || filename}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => { setImgError(true); setLoaded(true); }}
        className={`w-full aspect-square object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0 absolute'}`}
      />

      {/* ── Hover overlay ────────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-3">

        {/* Top row: Favorite & Action Buttons */}
        <div className="flex justify-between items-start">
          {/* Favorite button */}
          <button
            onClick={handleFavoriteClick}
            className={`flex items-center justify-center w-8 h-8 rounded-xl backdrop-blur-sm transition-all duration-200 ${
              isFavorited
                ? 'bg-red-500/20 text-red-500 border border-red-500/20 hover:bg-red-500/30'
                : 'bg-black/60 border border-white/5 text-white hover:text-red-400'
            }`}
            title={isFavorited ? 'Unfavorite' : 'Favorite'}
          >
            <svg className="w-4 h-4" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>

          {/* Action Row */}
          <div className="flex items-center gap-1.5">
            {/* Share button */}
            {currentUser && onShare && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(image._id);
                }}
                className="flex items-center justify-center w-8 h-8 rounded-xl bg-black/60 border border-white/5 backdrop-blur-sm text-white hover:text-indigo-400 transition-all duration-200"
                title="Share photo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M8.684 10.742L12 9.382l3.316 1.36m-6.632 2.68L12 14.618l3.316-1.36m-6.632-4.14a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm6.632 0a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM12 3v3m0 12v3" />
                </svg>
              </button>
            )}

            {/* Download button */}
            <button
              onClick={handleDownload}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-black/60 border border-white/5 backdrop-blur-sm text-white hover:text-indigo-400 transition-all duration-200"
              title="Download image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 3v12"/>
              </svg>
            </button>

            {/* Delete button */}
            {canDelete && (
              !confirming ? (
                <button
                  onClick={handleDeleteClick}
                  disabled={deleting}
                  title="Delete image"
                  className="flex items-center justify-center w-8 h-8 rounded-xl bg-black/60 border border-white/5 backdrop-blur-sm hover:bg-red-600/90 text-white transition-all duration-200 disabled:opacity-50"
                  id={`delete-btn-${image.publicId}`}
                >
                  {deleting ? (
                    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                    </svg>
                  )}
                </button>
              ) : (
                <div className="flex gap-1 bg-black/80 p-1 border border-white/5 rounded-xl">
                  <button onClick={handleCancelDelete} className="text-[9px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white transition-all duration-150">
                    Cancel
                  </button>
                  <button onClick={handleDeleteClick} className="text-[9px] px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white transition-all duration-150 font-semibold">
                    Confirm
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* Bottom: file name, info & tags */}
        <div className="space-y-1.5">
          <div>
            <p className="text-xs font-bold text-white truncate" title={image.title || filename}>
              {image.title || filename}
            </p>
            <div className="flex items-center justify-between mt-0.5 text-[9px] text-slate-400">
              <span>{formatDate(image.createdAt)}</span>
              {image.width && image.height && (
                <span>
                  {image.width}x{image.height} ({image.format})
                </span>
              )}
            </div>
          </div>

          {/* Tags */}
          {image.tags && image.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
              {image.tags.map((tag) => (
                <span
                  key={tag}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTagClick) onTagClick(tag);
                  }}
                  className="text-[8px] bg-white/10 hover:bg-indigo-500/30 hover:text-indigo-200 border border-white/5 px-1.5 py-0.5 rounded transition-all duration-150 font-medium cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageCard;
