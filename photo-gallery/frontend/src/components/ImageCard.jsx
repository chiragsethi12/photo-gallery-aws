// src/components/ImageCard.jsx - Individual gallery image card with hover overlay
import React, { useState } from 'react';

/**
 * ImageCard
 * Props:
 *   image    - { key, url, lastModified, size }
 *   onDelete - callback(key)
 *   deleting - boolean (true while DELETE request is in flight for this card)
 */
const ImageCard = ({ image, onDelete, deleting, onClick }) => {
  const [loaded, setLoaded]       = useState(false);
  const [imgError, setImgError]   = useState(false);
  const [confirming, setConfirming] = useState(false); // show confirm UI before delete

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch { return '—'; }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filename = image.key?.split('/').pop() || 'image';

  // ── Delete flow ───────────────────────────────────────────────────────────
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (!confirming) { setConfirming(true); return; }
    onDelete(image.key);
    setConfirming(false);
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setConfirming(false);
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
        src={image.url}
        alt={filename}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => { setImgError(true); setLoaded(true); }}
        className={`w-full aspect-square object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0 absolute'}`}
      />

      {/* ── Hover overlay ────────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-3">

        {/* Top-right: delete button */}
        <div className="flex justify-end">
          {!confirming ? (
            <button
              onClick={handleDeleteClick}
              disabled={deleting}
              title="Delete image"
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-black/60 backdrop-blur-sm hover:bg-red-600/90 text-white transition-all duration-200 disabled:opacity-50"
              id={`delete-btn-${image.key}`}
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
            /* Confirm / Cancel row */
            <div className="flex gap-1.5">
              <button onClick={handleCancelDelete} className="text-xs px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleDeleteClick} className="text-xs px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors font-medium">
                Confirm
              </button>
            </div>
          )}
        </div>

        {/* Bottom: file name & date */}
        <div>
          <p className="text-xs font-medium text-white truncate" title={filename}>{filename}</p>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[10px] text-slate-400">{formatDate(image.lastModified)}</span>
            {image.size && <span className="text-[10px] text-slate-400">{formatSize(image.size)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;
