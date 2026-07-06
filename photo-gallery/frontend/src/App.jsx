// src/App.jsx - Root application component
import React from 'react';
import Navbar  from './components/Navbar';
import Upload  from './components/Upload';
import Gallery from './components/Gallery';
import useGallery from './hooks/useGallery';

function App() {
  // All gallery state is managed in one custom hook
  const { 
    images, 
    loading, 
    error, 
    deleting, 
    totalPages, 
    currentPage, 
    totalImages, 
    loadImages, 
    deleteImage, 
    addImage 
  } = useGallery();

  return (
    <div className="min-h-screen bg-dark-900">

      {/* ── Top navigation ──────────────────────────────────────────────── */}
      <Navbar onRefresh={() => loadImages(1)} imageCount={totalImages} />

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
            Powered by AWS S3 · ap-south-1
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold gradient-text mb-3 leading-tight">
            Cloud Photo Gallery
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
            Upload, store, and manage your photos in the cloud — infinitely scalable, always available.
          </p>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Left column: upload panel ─────────────────────────────── */}
          <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <div className="sticky top-24">
              <Upload onUploadSuccess={addImage} />

              {/* S3 badge */}
              <div className="mt-4 glass rounded-xl p-4 text-xs text-slate-500 flex items-start gap-3">
                <svg className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <p>Files are encrypted-at-rest in your S3 bucket. AWS credentials are stored securely in server environment variables.</p>
              </div>
            </div>
          </aside>

          {/* ── Right column: gallery grid ─────────────────────────────── */}
          <div className="flex-1 min-w-0">
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
            />
          </div>

        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 mt-10 py-6 text-center text-xs text-slate-600">
        CloudSnap · Photo Gallery with AWS S3 · Built with React + Node.js
      </footer>

    </div>
  );
}

export default App;
