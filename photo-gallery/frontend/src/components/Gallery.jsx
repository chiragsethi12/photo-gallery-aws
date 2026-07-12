// src/components/Gallery.jsx - Responsive image grid with active filters, loading, and pagination controls
import React, { useState } from 'react';
import ImageCard from './ImageCard';
import Lightbox from './Lightbox';
import ShareModal from './ShareModal';

/**
 * Gallery
 * Props:
 *   images          - Array of image objects
 *   totalPages      - Total pages count
 *   currentPage     - Current page
 *   onPageChange    - (page) => void
 *   totalImages     - Total number of images
 *   loading         - Fetching loading state
 *   error           - Fetch error string
 *   deleting        - publicId of image currently deleting
 *   onDelete        - (publicId) => void
 *   onRetry         - () => void
 *   currentUser     - Active user object
 *   toggleFavorite  - (imageId, user) => void
 *   selectedAlbum   - Active album ID filter
 *   selectedTag     - Active tag filter
 *   onClearAlbumFilter - () => void
 *   onClearTagFilter   - () => void
 *   onTagClick      - (tag) => void
 *   albums          - Array of all albums
 */
const Gallery = ({
  images,
  totalPages = 1,
  currentPage = 1,
  onPageChange,
  totalImages = 0,
  loading,
  error,
  deleting,
  onDelete,
  onRetry,
  currentUser,
  toggleFavorite,
  selectedAlbum = '',
  selectedTag = '',
  onClearAlbumFilter,
  onClearTagFilter,
  onTagClick,
  albums = [],
  activeAlbumRole = null,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareResourceId, setShareResourceId] = useState(null);

  const handleShareImage = (imageId) => {
    setShareResourceId(imageId);
    setShowShareModal(true);
  };

  // ── Lightbox Navigation ──────────────────────────────────────────────────
  const handleNavigateLightbox = (direction) => {
    if (direction === 'next') {
      setSelectedIndex((prev) => (prev + 1) % images.length);
    } else {
      setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  // Find active album name
  const activeAlbumObj = albums.find((a) => a._id === selectedAlbum);
  const activeAlbumName = activeAlbumObj ? activeAlbumObj.name : 'Selected Album';

  // ── Loading skeleton grid ────────────────────────────────────────────────
  if (loading) {
    return (
      <section className="space-y-4">
        <SectionHeader count={null} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton rounded-2xl aspect-square" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      </section>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <section className="space-y-4">
        <SectionHeader count={0} />
        <div className="glass rounded-2xl p-10 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold text-white mb-1">Failed to load gallery</p>
            <p className="text-sm text-slate-400 max-w-xs">{error}</p>
          </div>
          <button
            onClick={onRetry}
            className="mt-2 px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!images || images.length === 0) {
    return (
      <section className="space-y-4">
        <SectionHeader count={0} />

        {/* Removable badges for filters in empty state */}
        {(selectedAlbum || selectedTag) && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedAlbum && (
              <span className="flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl font-medium">
                Album: {activeAlbumName}
                <button onClick={onClearAlbumFilter} className="hover:text-white transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </span>
            )}
            {selectedTag && (
              <span className="flex items-center gap-1.5 text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-xl font-medium">
                Tag: {selectedTag}
                <button onClick={onClearTagFilter} className="hover:text-white transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </span>
            )}
          </div>
        )}

        <div className="glass rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center">
            <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold text-white mb-1">No photos yet</p>
            <p className="text-sm text-slate-400">
              {selectedAlbum || selectedTag 
                ? 'Try clearing active filters to see other photos.'
                : 'Upload your first image using the panel on the left.'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // ── Image grid ───────────────────────────────────────────────────────────
  return (
    <section className="space-y-4">
      <SectionHeader count={totalImages} />

      {/* ── Active Filter Badges ────────────────────────────────────────── */}
      {(selectedAlbum || selectedTag) && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedAlbum && (
            <span className="flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl font-medium">
              Album: {activeAlbumName}
              <button
                onClick={onClearAlbumFilter}
                className="hover:text-white transition-colors"
                title="Clear Album Filter"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </span>
          )}
          {selectedTag && (
            <span className="flex items-center gap-1.5 text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-xl font-medium">
              Tag: {selectedTag}
              <button
                onClick={onClearTagFilter}
                className="hover:text-white transition-colors"
                title="Clear Tag Filter"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {images.map((image, index) => (
          <ImageCard
            key={image.publicId}
            image={image}
            onDelete={onDelete}
            deleting={deleting === image.publicId}
            onClick={() => setSelectedIndex(index)}
            currentUser={currentUser}
            toggleFavorite={toggleFavorite}
            onTagClick={onTagClick}
            activeAlbumRole={activeAlbumRole}
            onShare={handleShareImage}
          />
        ))}
      </div>

      {/* ── Pagination Controls ─────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 p-4 glass rounded-2xl border border-white/5 shadow-lg">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-4 py-2 text-sm font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            ← Previous
          </button>
          <span className="text-xs text-slate-400 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 text-sm font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            Next →
          </button>
        </div>
      )}

      {/* ── Lightbox Modal ────────────────────────────────────────────────── */}
      {selectedIndex !== null && (
        <Lightbox 
          images={images}
          selectedIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onNavigate={handleNavigateLightbox}
        />
      )}

      {showShareModal && (
        <ShareModal
          resourceType="image"
          resourceId={shareResourceId}
          onClose={() => {
            setShowShareModal(false);
            setShareResourceId(null);
          }}
        />
      )}
    </section>
  );
};

// ── Sub-component: section header label ─────────────────────────────────────
const SectionHeader = ({ count }) => (
  <div className="flex items-center justify-between mb-2">
    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
      Your Gallery
    </h2>
    {count !== null && (
      <span className="text-xs text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
        {count} {count === 1 ? 'photo' : 'photos'}
      </span>
    )}
  </div>
);

export default Gallery;
