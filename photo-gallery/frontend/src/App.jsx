// src/App.jsx - Root application component with context switching and global state wiring
import React, { useContext, useState, useEffect } from 'react';
import Navbar  from './components/Navbar';
import Upload  from './components/Upload';
import Gallery from './components/Gallery';
import AlbumsView from './components/AlbumsView';
import SessionsPanel from './components/SessionsPanel';
import TrashView from './components/TrashView';
import CollaboratorPanel from './components/CollaboratorPanel';
import useGallery from './hooks/useGallery';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { fetchAlbumById } from './api/imageApi';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';

function MainApp() {
  const { user, logout } = useContext(AuthContext);
  const [isLoginView, setIsLoginView] = useState(true);
  const [viewMode, setViewMode] = useState('photos'); // 'photos' or 'albums'
  const [activeAlbumDetails, setActiveAlbumDetails] = useState(null);
  const [showCollaborators, setShowCollaborators] = useState(false);

  // Extract all states and actions from the centralized hook
  const { 
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
    albumScope,
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
    addImage 
  } = useGallery();

  // Load albums list as soon as user logs in
  useEffect(() => {
    if (user) {
      loadAlbums();
    }
  }, [user, loadAlbums]);

  // Handle selecting an album card from AlbumsView
  const handleSelectAlbum = async (albumId) => {
    filterByAlbum(albumId);
    setViewMode('photos');
    setShowCollaborators(false);
    try {
      const details = await fetchAlbumById(albumId);
      setActiveAlbumDetails(details);
    } catch (err) {
      console.error('Failed to load album details:', err);
      setActiveAlbumDetails(null);
    }
  };

  const handleClearAlbum = () => {
    filterByAlbum('');
    setActiveAlbumDetails(null);
    setShowCollaborators(false);
  };

  const refreshActiveAlbum = async () => {
    if (!selectedAlbum) return;
    try {
      const details = await fetchAlbumById(selectedAlbum);
      setActiveAlbumDetails(details);
    } catch (err) {
      console.error('Failed to refresh album details:', err);
    }
  };

  // Show authentication screen if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-[#070d1a] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
        
        {isLoginView ? (
          <LoginForm onToggleForm={() => setIsLoginView(false)} />
        ) : (
          <RegisterForm onToggleForm={() => setIsLoginView(true)} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070d1a]">

      {/* ── Top navigation ──────────────────────────────────────────────── */}
      <Navbar 
        onRefresh={() => {
          if (viewMode === 'photos') {
            loadImages(1);
          } else {
            loadAlbums();
          }
        }} 
        imageCount={totalImages} 
        user={user} 
        onLogout={logout} 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
      />

      {/* ── Page hero banner ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-indigo-950/40 to-transparent border-b border-white/5 py-10 px-4">
        {/* Decorative blurred circles */}
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -top-10 right-10 w-64 h-64 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-4">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5.5 16.5l-3-3 3-3M14.5 7.5l3 3-3 3M9 4l2 12"/>
            </svg>
            Interactive Cloud Gallery & Album Board
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold gradient-text mb-3 leading-tight">
            Cloud Photo Gallery
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
            Upload, categorize with tags, group into custom albums, and favorite your photos on a high-availability cloud database.
          </p>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Left column: upload panel ─────────────────────────────── */}
          {viewMode === 'photos' && (
          <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <div className="sticky top-24">
              {(!selectedAlbum || (activeAlbumDetails && activeAlbumDetails.role !== 'viewer')) && (
                <Upload onUploadSuccess={addImage} activeAlbum={selectedAlbum} albums={albums} />
              )}

              {/* Info badge */}
              <div className="mt-4 glass rounded-xl p-4 text-xs text-slate-500 flex items-start gap-3">
                <svg className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <p>Attach photos to albums and add search tags. You can favorite photos to highlight them or download the full resolution with one click.</p>
              </div>
            </div>
          </aside>
          )}

          {/* ── Right column: toggleable view grid ──────────────────────── */}
          <div className="flex-1 min-w-0">
            {viewMode === 'albums' ? (
              <AlbumsView
                albums={albums}
                loading={albumsLoading}
                albumScope={albumScope}
                onSelectAlbum={handleSelectAlbum}
                onRefreshAlbums={loadAlbums}
              />
            ) : viewMode === 'sessions' ? (
              <SessionsPanel />
            ) : viewMode === 'trash' ? (
              <TrashView
                trashImages={trashImages}
                trashAlbums={trashAlbums}
                loading={trashLoading}
                loadTrash={loadTrash}
                restoreImage={restoreImage}
                restoreAlbum={restoreAlbum}
                permanentlyDeleteImage={permanentlyDeleteImage}
                permanentlyDeleteAlbum={permanentlyDeleteAlbum}
              />
            ) : (
              <div className="space-y-6 w-full">
                {activeAlbumDetails && (
                  <div className="glass rounded-2xl border border-white/5 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-xs text-slate-400">Viewing Album: </span>
                      <strong className="text-white text-sm">{activeAlbumDetails.name}</strong>
                      <span className={`ml-2.5 inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${
                        activeAlbumDetails.role === 'owner'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : activeAlbumDetails.role === 'contributor'
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {activeAlbumDetails.role === 'owner' ? 'Owner' : `Shared: ${activeAlbumDetails.role}`}
                      </span>
                    </div>

                    {activeAlbumDetails.role === 'owner' && (
                      <button
                        onClick={() => setShowCollaborators(!showCollaborators)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-200 transition-all flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        {showCollaborators ? 'Hide Collaborators' : 'Manage Collaborators'}
                      </button>
                    )}
                  </div>
                )}

                {showCollaborators && activeAlbumDetails && activeAlbumDetails.role === 'owner' && (
                  <CollaboratorPanel
                    albumId={selectedAlbum}
                    collaborators={activeAlbumDetails.collaborators || []}
                    onRefreshAlbum={refreshActiveAlbum}
                  />
                )}
                
                <Gallery
                  images={images}
                  totalPages={totalPages}
                  currentPage={currentPage}
                  totalImages={totalImages}
                  loading={loading}
                  error={error}
                  deleting={deleting}
                  onDelete={deleteImage}
                  onRetry={() => loadImages(currentPage)}
                  onPageChange={loadImages}
                  currentUser={user}
                  toggleFavorite={toggleFavorite}
                  selectedAlbum={selectedAlbum}
                  selectedTag={selectedTag}
                  onClearAlbumFilter={handleClearAlbum}
                  onClearTagFilter={() => filterByTag('')}
                  onTagClick={filterByTag}
                  albums={albums}
                  activeAlbumRole={activeAlbumDetails?.role}
                />
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 mt-10 py-6 text-center text-xs text-slate-600">
        CloudSnap · Photo Gallery Board · Powered by MongoDB & Express
      </footer>

    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
