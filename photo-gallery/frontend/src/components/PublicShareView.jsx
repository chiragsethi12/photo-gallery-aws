// src/components/PublicShareView.jsx - Unauthenticated, read-only presentation screen for shared links
import React, { useState, useEffect } from 'react';
import { fetchSharedResource } from '../api/imageApi';
import ImageCard from './ImageCard';
import Lightbox from './Lightbox';

const PublicShareView = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [sharedData, setSharedData] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const loadResource = async (pwd = '') => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchSharedResource(token, pwd);
      setSharedData(data);
      setRequiresPassword(false);
    } catch (err) {
      if (err.response?.status === 401 && err.response?.data?.requiresPassword) {
        setRequiresPassword(true);
        if (pwd) {
          setError('Incorrect password. Please try again.');
        }
      } else {
        setError(err.response?.data?.error || 'This link is no longer available');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadResource();
    }
  }, [token]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    loadResource(passwordInput);
  };

  const handleNavigateLightbox = (direction) => {
    if (!sharedData) return;
    const images = sharedData.resourceType === 'album' ? sharedData.images : [sharedData.image];
    const count = images.length;
    if (direction === 'next') {
      setSelectedIndex((prev) => (prev + 1) % count);
    } else {
      setSelectedIndex((prev) => (prev - 1 + count) % count);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
        <div className="skeleton rounded-2xl w-24 h-24 mb-4 animate-pulse" />
        <p className="text-slate-400 text-sm">Loading shared content...</p>
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="glass rounded-2xl border border-white/10 p-8 space-y-6 shadow-2xl">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Password Protected</h3>
              <p className="text-xs text-slate-400 mt-1">This shared resource requires a password to view.</p>
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input
                type="password"
                placeholder="Enter password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                required
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-500/20 h-[38px] flex items-center justify-center"
              >
                Access Content
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (error || !sharedData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Resource Unavailable</h3>
            <p className="text-sm text-slate-400 mt-2">{error || 'This link is no longer available'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Renders the resolved resource
  const isAlbum = sharedData.resourceType === 'album';
  const albumData = sharedData.album;
  const images = isAlbum ? sharedData.images : [sharedData.image];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Mini public header */}
      <header className="bg-slate-900/60 border-b border-white/5 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              P
            </div>
            <span className="text-sm font-bold tracking-wide text-white">Photo Gallery Share</span>
          </div>
          <span className="text-xs text-slate-400 italic">Public Access</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Banner metadata */}
        <div className="glass rounded-3xl border border-white/5 p-8 relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-indigo-600/5 blur-3xl pointer-events-none" />
          <div className="relative space-y-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {isAlbum ? 'Shared Album' : 'Shared Image'}
            </span>
            <h1 className="text-3xl font-extrabold text-white">
              {isAlbum ? albumData.name : images[0].title || 'Shared Image'}
            </h1>
            {isAlbum && albumData.description && (
              <p className="text-sm text-slate-400 max-w-2xl">{albumData.description}</p>
            )}
            <p className="text-[10px] text-slate-500">
              Shared on {new Date(isAlbum ? albumData.createdAt : images[0].createdAt).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Gallery grid */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg>
              Shared Photos ({images.length})
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((image, index) => (
              <ImageCard
                key={image.publicId}
                image={image}
                onDelete={null}
                deleting={false}
                onClick={() => setSelectedIndex(index)}
                currentUser={null}
                toggleFavorite={null}
                onTagClick={null}
                activeAlbumRole="viewer" // Forces read-only access (no deletes/favorites)
              />
            ))}
          </div>
        </div>
      </main>

      {/* Lightbox showcase */}
      {selectedIndex !== null && (
        <Lightbox
          images={images}
          selectedIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onNavigate={handleNavigateLightbox}
        />
      )}
    </div>
  );
};

export default PublicShareView;
