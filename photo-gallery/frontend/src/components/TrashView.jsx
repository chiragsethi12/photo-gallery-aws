// src/components/TrashView.jsx - Glassmorphic dashboard to manage soft-deleted assets
import React, { useEffect, useState } from 'react';

const TrashView = ({
  trashImages,
  trashAlbums,
  loading,
  loadTrash,
  restoreImage,
  restoreAlbum,
  permanentlyDeleteImage,
  permanentlyDeleteAlbum
}) => {
  const [confirmingImage, setConfirmingImage] = useState(null);
  const [confirmingAlbum, setConfirmingAlbum] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  const handleRestoreImage = async (id) => {
    try {
      setActionLoading(true);
      await restoreImage(id);
    } catch (err) {
      alert('Failed to restore image.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreAlbum = async (id) => {
    try {
      setActionLoading(true);
      await restoreAlbum(id);
    } catch (err) {
      alert('Failed to restore album.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentlyDeleteImage = async (id) => {
    try {
      setActionLoading(true);
      await permanentlyDeleteImage(id);
      setConfirmingImage(null);
    } catch (err) {
      alert('Failed to permanently delete image.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentlyDeleteAlbum = async (id) => {
    try {
      setActionLoading(true);
      await permanentlyDeleteAlbum(id);
      setConfirmingAlbum(null);
    } catch (err) {
      alert('Failed to permanently delete album.');
    } finally {
      setActionLoading(false);
    }
  };

  const getRemainingDays = (deletedAt) => {
    if (!deletedAt) return 30;
    const deletedDate = new Date(deletedAt);
    const expireDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffMs = expireDate - now;
    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    return Math.max(0, diffDays);
  };

  return (
    <div className="glass rounded-2xl border border-white/5 p-6 md:p-8 shadow-xl shadow-black/30 animate-fade-in max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-bold text-white">Trash Bin</h2>
          <p className="text-xs text-slate-400 mt-1">
            Items in the trash will be permanently deleted after 30 days.
          </p>
        </div>
        <button
          onClick={loadTrash}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          disabled={loading || actionLoading}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : trashImages.length === 0 && trashAlbums.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          <svg className="w-12 h-12 mx-auto opacity-20 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"/>
          </svg>
          <p>Your trash bin is empty.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* --- Soft-deleted Albums --- */}
          {trashAlbums.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4">Trashed Albums</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trashAlbums.map((album) => (
                  <div key={album._id} className="relative rounded-2xl bg-white/3 border border-white/5 p-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white truncate">{album.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{album.description || 'No description'}</p>
                      <span className="inline-block mt-3 text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-medium">
                        Permanently deleted in {getRemainingDays(album.deletedAt)} days
                      </span>
                    </div>

                    <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
                      <button
                        onClick={() => handleRestoreAlbum(album._id)}
                        disabled={actionLoading}
                        className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        Restore
                      </button>

                      {confirmingAlbum === album._id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => setConfirmingAlbum(null)}
                            className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[10px] transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handlePermanentlyDeleteAlbum(album._id)}
                            className="px-2 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmingAlbum(album._id)}
                          className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-red-600 hover:text-white text-slate-400 text-xs font-semibold transition-all"
                        >
                          Delete Forever
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- Soft-deleted Images --- */}
          {trashImages.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4">Trashed Photos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {trashImages.map((image) => (
                  <div key={image._id} className="group relative rounded-2xl bg-white/3 border border-white/5 overflow-hidden flex flex-col justify-between">
                    <div className="aspect-square relative overflow-hidden bg-black/40">
                      <img
                        src={image.url}
                        alt={image.title || 'Trashed'}
                        className="w-full h-full object-cover opacity-75 group-hover:opacity-90 transition-opacity"
                      />
                      <span className="absolute bottom-2 left-2 text-[9px] bg-red-500/90 text-white px-2 py-0.5 rounded-full font-bold shadow-lg">
                        {getRemainingDays(image.deletedAt)}d left
                      </span>
                    </div>

                    <div className="p-3">
                      <p className="text-xs font-bold text-white truncate" title={image.title || 'Untitled'}>
                        {image.title || 'Untitled'}
                      </p>
                      
                      <div className="flex gap-1.5 mt-3 pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleRestoreImage(image._id)}
                          disabled={actionLoading}
                          className="flex-1 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
                        >
                          Restore
                        </button>

                        {confirmingImage === image._id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => setConfirmingImage(null)}
                              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white text-[10px] transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handlePermanentlyDeleteImage(image._id)}
                              className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmingImage(image._id)}
                            className="flex-1 py-1 rounded bg-white/5 hover:bg-red-600 hover:text-white text-slate-400 text-[11px] font-semibold transition-all"
                          >
                            Delete Forever
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrashView;
