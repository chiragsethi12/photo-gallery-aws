// src/components/Lightbox.jsx - Full-screen image preview modal
import React, { useEffect } from 'react';

const Lightbox = ({ images, selectedIndex, onClose, onNavigate }) => {
  useEffect(() => {
    // Prevent scrolling on the body while modal is open
    document.body.style.overflow = 'hidden';
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate('prev');
      if (e.key === 'ArrowRight') onNavigate('next');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onNavigate]);

  if (selectedIndex === null || !images[selectedIndex]) return null;

  const currentImage = images[selectedIndex];
  const filename = currentImage.publicId?.split('/').pop() || 'image';

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* ── Top bar: Info and Close ────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="text-white text-sm opacity-80 max-w-[70%] pointer-events-auto">
          <p className="font-medium truncate">{filename}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date(currentImage.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
            })}
          </p>
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Close (Esc)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Main Image ─────────────────────────────────────────────────────── */}
      <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        <img 
          src={currentImage.url} 
          alt={filename} 
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-transform duration-300 scale-95 animate-[zoomIn_0.3s_ease-out_forwards]"
          onClick={(e) => e.stopPropagation()} // Prevent click from closing
        />
      </div>

      {/* ── Navigation Arrows ──────────────────────────────────────────────── */}
      {images.length > 1 && (
        <>
          <button 
            onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }}
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors border border-white/10"
            title="Previous (Left Arrow)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); onNavigate('next'); }}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors border border-white/10"
            title="Next (Right Arrow)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      <style>{`
        @keyframes zoomIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Lightbox;
