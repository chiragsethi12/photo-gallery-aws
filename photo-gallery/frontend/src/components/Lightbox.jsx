// src/components/Lightbox.jsx - Split-screen full image viewer and interactive comment dashboard
import React, { useState, useEffect, useCallback } from 'react';
import { fetchComments, addComment, deleteComment } from '../api/imageApi';

const Lightbox = ({
  images,
  selectedIndex,
  onClose,
  onNavigate,
  currentUser,
  activeAlbumRole = null,
}) => {
  const currentImage = selectedIndex !== null ? images[selectedIndex] : null;

  // Comments state
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [inputText, setInputText] = useState('');

  // ── Keyboard Navigation ──────────────────────────────────────────────────
  useEffect(() => {
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

  // ── Fetch Comments Callback ──────────────────────────────────────────────
  const fetchPage = useCallback(async (imageId, pageNum, replace = false) => {
    if (!imageId) return;
    setLoadingComments(true);
    try {
      const data = await fetchComments(imageId, pageNum, 10);
      if (replace) {
        setComments(data.comments || []);
      } else {
        setComments((prev) => [...prev, ...(data.comments || [])]);
      }
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  // Reload comments when active image changes
  useEffect(() => {
    if (currentImage && currentImage._id) {
      setComments([]);
      setCurrentPage(1);
      setTotalPages(1);
      fetchPage(currentImage._id, 1, true);
    }
  }, [currentImage?._id, fetchPage]);

  if (selectedIndex === null || !currentImage) return null;

  const filename = currentImage.publicId?.split('/').pop() || 'image';

  // ── Access Checks ────────────────────────────────────────────────────────
  const canComment = currentUser && (
    activeAlbumRole ||
    !currentImage.album ||
    (currentImage.uploadedBy && (
      currentImage.uploadedBy === currentUser.id ||
      currentImage.uploadedBy._id === currentUser.id
    ))
  );

  const canDeleteComment = (c) => {
    if (!currentUser) return false;
    const isAuthor = c.author && (c.author._id === currentUser.id || c.author === currentUser.id);
    const isAlbumOwner = activeAlbumRole === 'owner';
    return isAuthor || isAlbumOwner;
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      fetchPage(currentImage._id, currentPage + 1);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    const commentText = inputText.trim();
    setInputText('');

    // Generate temp ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      _id: tempId,
      text: commentText,
      author: {
        _id: currentUser.id,
        name: currentUser.name || 'You',
      },
      createdAt: new Date().toISOString(),
    };

    // Prepend locally (newest comment shows up first)
    setComments((prev) => [optimisticComment, ...prev]);

    try {
      const savedComment = await addComment(currentImage._id, commentText);
      // Replace optimistic comment with database copy containing true _id
      setComments((prev) =>
        prev.map((c) => (c._id === tempId ? savedComment : c))
      );
    } catch (err) {
      console.error('Failed to submit comment:', err);
      // Rollback on failure
      setComments((prev) => prev.filter((c) => c._id !== tempId));
      setInputText(commentText);
      alert(err.response?.data?.error || 'Failed to submit comment.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    // Save backup copy
    const backup = [...comments];
    // Optimistic local state update
    setComments((prev) => prev.filter((c) => c._id !== commentId));

    try {
      await deleteComment(commentId);
    } catch (err) {
      console.error('Failed to delete comment:', err);
      // Revert rollback
      setComments(backup);
      alert(err.response?.data?.error || 'Failed to delete comment.');
    }
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return '—';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col md:flex-row bg-[#030712]/98 backdrop-blur-md animate-fade-in font-sans"
      onClick={onClose}
    >
      {/* ── Left Image Frame ───────────────────────────────────────────────── */}
      <div 
        className="flex-1 flex flex-col items-center justify-center p-4 relative min-h-[45vh] md:min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Info Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center bg-gradient-to-b from-[#030712]/90 to-transparent z-10 pointer-events-none">
          <div className="text-white text-sm opacity-90 max-w-[75%] pointer-events-auto">
            <p className="font-bold truncate text-base">{currentImage.title || filename}</p>
            <p className="text-xs text-slate-400 mt-1">
              Uploaded on {new Date(currentImage.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </p>
          </div>
          
          <button 
            onClick={onClose}
            className="pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all border border-white/10"
            title="Close (Esc)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Central Image Container */}
        <div className="relative max-w-[85%] max-h-[75vh] flex items-center justify-center">
          <img 
            src={currentImage.url} 
            alt={filename} 
            className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl shadow-black/80 animate-[zoomIn_0.3s_ease-out_forwards]"
          />
        </div>

        {/* Carousel Navigation */}
        {images.length > 1 && (
          <>
            <button 
              onClick={() => onNavigate('prev')}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/85 text-slate-300 hover:text-white border border-white/5 hover:border-white/15 transition-all shadow-lg"
              title="Previous"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <button 
              onClick={() => onNavigate('next')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/85 text-slate-300 hover:text-white border border-white/5 hover:border-white/15 transition-all shadow-lg"
              title="Next"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* ── Right Comments Sidebar ─────────────────────────────────────────── */}
      <div 
        className="w-full md:w-[400px] h-[55vh] md:h-full flex flex-col bg-slate-950 border-t md:border-t-0 md:border-l border-white/5 shadow-2xl relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Comments
          </h4>
          <span className="text-xs text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full font-medium">
            {comments.length}
          </span>
        </div>

        {/* Scrollable Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 custom-scrollbar">
          {comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-10">
              <svg className="w-10 h-10 opacity-20 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              <p className="text-xs font-semibold">No comments yet</p>
              <p className="text-[10px] opacity-75 mt-0.5">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {comments.map((c) => (
                  <div 
                    key={c._id} 
                    className="group/item bg-white/3 border border-white/5 rounded-xl p-3 flex items-start gap-2 text-xs relative"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-bold text-slate-200 truncate max-w-[120px]">
                          {c.author?.name || 'Unknown User'}
                        </span>
                        <span className="text-[9px] text-slate-500 font-medium">
                          {formatDate(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-300 break-words whitespace-pre-wrap leading-relaxed">{c.text}</p>
                    </div>

                    {/* Delete button (Optimistic & Auth check) */}
                    {canDeleteComment(c) && (
                      <button
                        onClick={() => handleDeleteComment(c._id)}
                        className="opacity-0 group-hover/item:opacity-100 text-slate-500 hover:text-red-400 w-6 h-6 rounded-lg hover:bg-red-500/10 flex items-center justify-center transition-all flex-shrink-0"
                        title="Delete Comment"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Paginated Load More */}
              {currentPage < totalPages && (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingComments}
                  className="w-full py-2.5 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/5 text-slate-300 hover:text-white transition-all text-[11px] font-semibold flex items-center justify-center gap-1.5"
                >
                  {loadingComments ? (
                    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : 'Load More Comments'}
                </button>
              )}
            </>
          )}
        </div>

        {/* Input Box Footer */}
        <div className="p-4 border-t border-white/5 bg-slate-950/60">
          {canComment ? (
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                maxLength={1000}
                className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center"
              >
                Post
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 bg-white/3 border border-white/5 p-3 rounded-xl italic">
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              Comments are locked for this private photo.
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes zoomIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </div>
  );
};

export default Lightbox;
