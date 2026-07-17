// src/components/ImageCard.jsx - Premium gallery thumbnail with selection and quick actions
import React, { useState } from 'react';
import { Check, Download, Heart, Loader2, MoreHorizontal, Share2, Trash2, X } from 'lucide-react';
import { motion } from 'framer-motion';

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
  selected = false,
  onToggleSelect = null,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const canDelete = currentUser && (
    !image.uploadedBy || 
    image.uploadedBy === currentUser.id || 
    image.uploadedBy._id === currentUser.id || 
    activeAlbumRole === 'owner'
  );

  const isFavorited = image.favoritedBy && currentUser && (
    image.favoritedBy.includes(currentUser.id) || image.favoritedBy.some((id) => id === currentUser.id || id._id === currentUser.id)
  );

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  const filename = image.publicId?.split('/').pop() || 'image';

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      return;
    }
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

  const handleSelectClick = (e) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect();
    }
  };

  const getThumbnailUrl = (url) => {
    if (!url) return '';
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/w_400,q_auto,f_auto/');
    }
    return url;
  };

  const getDownloadUrl = (url) => {
    if (!url) return '';
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/fl_attachment/');
    }
    return url;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative cursor-pointer overflow-hidden rounded-[24px] border transition-all duration-300 ${selected ? 'border-emerald-400/60 shadow-[0_16px_60px_-20px_rgba(16,185,129,0.35)]' : 'border-slate-800 bg-slate-900/60 hover:border-emerald-400/40'}`}
      onClick={onClick}
    >
      {!loaded && !imgError ? <div className="skeleton aspect-square w-full" /> : null}

      {imgError ? (
        <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-slate-950/70 text-sm text-slate-500">
          <X className="h-8 w-8" />
          <span>Failed to load</span>
        </div>
      ) : null}

      <img
        src={getThumbnailUrl(image.url)}
        alt={image.title || filename}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setImgError(true);
          setLoaded(true);
        }}
        className={`aspect-square w-full object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0 absolute'}`}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100" />

      <div className="absolute left-3 top-3 z-10">
        <button onClick={handleSelectClick} className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${selected ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-300' : 'border-slate-700 bg-slate-950/60 text-slate-300 hover:border-emerald-400/40'}`}>
          {selected ? <Check className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
        </button>
      </div>

      <div className="absolute right-3 top-3 z-10 flex gap-2">
        <button onClick={handleFavoriteClick} className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${isFavorited ? 'border-rose-400/40 bg-rose-500/15 text-rose-300' : 'border-slate-700 bg-slate-950/60 text-slate-300 hover:border-rose-400/40'}`} title={isFavorited ? 'Unfavorite' : 'Favorite'}>
          <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="absolute inset-x-3 bottom-3 z-10 flex flex-col gap-2">
        <div className="flex items-center justify-end gap-2">
          {currentUser && onShare ? (
            <button onClick={(e) => { e.stopPropagation(); onShare(image._id); }} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-950/60 text-slate-200 transition-all hover:border-emerald-400/40 hover:text-white">
              <Share2 className="h-4 w-4" />
            </button>
          ) : null}
          <button onClick={handleDownload} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-950/60 text-slate-200 transition-all hover:border-emerald-400/40 hover:text-white">
            <Download className="h-4 w-4" />
          </button>
          {canDelete ? (
            !confirming ? (
              <button onClick={handleDeleteClick} disabled={deleting} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-950/60 text-slate-200 transition-all hover:border-rose-400/40 hover:text-rose-300 disabled:opacity-60" id={`delete-btn-${image.publicId}`}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            ) : (
              <div className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-950/80 p-1">
                <button onClick={handleCancelDelete} className="rounded-full px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-800">Cancel</button>
                <button onClick={handleDeleteClick} className="rounded-full bg-rose-500/20 px-2 py-1 text-[10px] font-semibold text-rose-300">Confirm</button>
              </div>
            )
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3 backdrop-blur-sm">
          <p className="truncate text-sm font-semibold text-white" title={image.title || filename}>{image.title || filename}</p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>{formatDate(image.createdAt)}</span>
            {image.width && image.height ? <span>{image.width}×{image.height}</span> : null}
          </div>
          {image.tags && image.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {image.tags.map((tag) => (
                <span key={tag} onClick={(e) => { e.stopPropagation(); if (onTagClick) onTagClick(tag); }} className="rounded-full border border-slate-700 bg-slate-900/70 px-2 py-0.5 text-[10px] text-slate-300">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};

export default ImageCard;
