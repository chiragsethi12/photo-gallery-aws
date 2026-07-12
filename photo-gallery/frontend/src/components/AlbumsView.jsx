// src/components/AlbumsView.jsx - Album gallery layout and album creation controls
import React, { useState } from 'react';
import ShareModal from './ShareModal';
import { createAlbum } from '../api/imageApi';

/**
 * AlbumsView
 * Props:
 *   albums - Array of album documents { _id, name, description, coverImage, imageCount }
 *   loading - Boolean loading state
 *   onSelectAlbum - (albumId) => void
 *   onRefreshAlbums - () => void
 */
const AlbumsView = ({ albums, loading, albumScope, onSelectAlbum, onRefreshAlbums, currentUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareResourceId, setShareResourceId] = useState(null);
  const [shareResourceType, setShareResourceType] = useState('album');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Album name is required.');
      return;
    }

    setCreating(true);
    setError('');

    try {
      await createAlbum({ name, description });
      setName('');
      setDescription('');
      setShowModal(false);
      onRefreshAlbums();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create album.');
    } finally {
      setCreating(false);
    }
  };

  if (loading && albums.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton aspect-[4/3] rounded-2xl" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Header with Add Album button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
          Albums ({albums.length})
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all duration-200 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4"/>
          </svg>
          New Album
        </button>
      </div>

      {/* Scope Filter Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-3">
        {['all', 'mine', 'shared'].map((scope) => (
          <button
            key={scope}
            onClick={() => onRefreshAlbums(scope)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
              albumScope === scope
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {scope === 'all' ? 'All' : scope === 'mine' ? 'My Albums' : 'Shared With Me'}
          </button>
        ))}
      </div>

      {albums.length === 0 ? (
        /* Empty State */
        <div className="glass rounded-2xl p-16 flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center">
            <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold text-white mb-1">No albums yet</p>
            <p className="text-sm text-slate-400 max-w-sm">Create an album to organize your photos and group them together.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-200 transition-colors"
          >
            Create Your First Album
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {albums.map((album) => {
            const isOwner = album.createdBy && currentUser && (
              album.createdBy === currentUser.id ||
              (album.createdBy._id && album.createdBy._id === currentUser.id)
            );
            const collabRecord = album.collaborators?.find(
              (c) => (c.user?._id || c.user) === currentUser?.id
            );
            const isContributor = collabRecord?.role === 'contributor';
            const canShare = isOwner || isContributor;

            return (
              <div
                key={album._id}
                onClick={() => onSelectAlbum(album._id)}
                className="group cursor-pointer aspect-[4/3] rounded-2xl overflow-hidden glass border border-white/5 relative flex flex-col justify-end p-4 shadow-xl hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Share button */}
                {canShare && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShareResourceId(album._id);
                      setShareResourceType('album');
                      setShowShareModal(true);
                    }}
                    className="absolute top-3 right-3 z-20 w-8 h-8 rounded-xl bg-black/60 border border-white/5 backdrop-blur-sm opacity-0 group-hover:opacity-100 text-white hover:text-indigo-400 flex items-center justify-center transition-all duration-200"
                    title="Share Album"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M8.684 10.742L12 9.382l3.316 1.36m-6.632 2.68L12 14.618l3.316-1.36m-6.632-4.14a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm6.632 0a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM12 3v3m0 12v3" />
                    </svg>
                  </button>
                )}
              {/* Cover Image */}
              <div className="absolute inset-0 bg-dark-950 overflow-hidden">
                {album.coverImage ? (
                  <img
                    src={album.coverImage}
                    alt={album.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 opacity-60 group-hover:opacity-80"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900/40 flex items-center justify-center">
                    <svg className="w-12 h-12 text-slate-700/50" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                )}
                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              </div>

              {/* Card Meta Content */}
              <div className="relative z-10 space-y-1">
                <h3 className="text-base font-bold text-white truncate" title={album.name}>
                  {album.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-1">
                  {album.description || 'No description'}
                </p>
                <div className="pt-1">
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/20 px-2 py-0.5 rounded-full">
                    {album.imageCount} {album.imageCount === 1 ? 'photo' : 'photos'}
                  </span>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* ── Create Album Floating Modal ────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl glass border border-white/10 shadow-2xl relative overflow-hidden animate-zoom-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                </svg>
                Create Album
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateAlbum} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2" htmlFor="album-name">
                  Album Name
                </label>
                <input
                  id="album-name"
                  type="text"
                  placeholder="e.g. Summer Trip 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                  disabled={creating}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2" htmlFor="album-desc">
                  Description
                </label>
                <textarea
                  id="album-desc"
                  rows="3"
                  placeholder="Tell something about this album..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200 resize-none"
                  disabled={creating}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-all duration-200"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-2 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center justify-center gap-2"
                >
                  {creating ? 'Creating…' : 'Create Album'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showShareModal && (
        <ShareModal
          resourceType={shareResourceType}
          resourceId={shareResourceId}
          onClose={() => {
            setShowShareModal(false);
            setShareResourceId(null);
          }}
        />
      )}
    </div>
  );
};

export default AlbumsView;
