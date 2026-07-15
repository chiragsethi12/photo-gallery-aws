// src/components/ActivityFeed.jsx - Paginated feed showing human-readable logs of album activity events
import React, { useState, useEffect, useCallback } from 'react';
import { fetchAlbumActivity } from '../api/imageApi';

const ActivityFeed = ({ albumId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadActivities = useCallback(async (pageNum, replace = false) => {
    if (!albumId) return;
    setLoading(true);
    try {
      const data = await fetchAlbumActivity(albumId, pageNum, 8);
      if (replace) {
        setActivities(data.activities || []);
      } else {
        setActivities((prev) => [...prev, ...(data.activities || [])]);
      }
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  }, [albumId]);

  useEffect(() => {
    setActivities([]);
    setCurrentPage(1);
    setTotalPages(1);
    loadActivities(1, true);
  }, [albumId, loadActivities]);

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      loadActivities(currentPage + 1);
    }
  };

  const formatActivityText = (act) => {
    const actorName = act.actor?.name || 'Someone';
    const meta = act.metadata || {};

    switch (act.type) {
      case 'upload':
        const count = meta.count || 1;
        return (
          <span>
            <strong className="text-slate-200">{actorName}</strong> uploaded{' '}
            <strong className="text-indigo-400">{count}</strong> photo{count > 1 ? 's' : ''} to this album.
          </span>
        );
      case 'comment':
        const title = meta.imageTitle ? ` "${meta.imageTitle}"` : ' a photo';
        return (
          <span>
            <strong className="text-slate-200">{actorName}</strong> commented on{title}.
          </span>
        );
      case 'collaborator_added':
        return (
          <span>
            <strong className="text-slate-200">{actorName}</strong> added{' '}
            <strong className="text-emerald-400">{meta.addedUserName || 'a user'}</strong> as a{' '}
            <span className="text-indigo-300 font-semibold">{meta.role}</span>.
          </span>
        );
      case 'collaborator_removed':
        return (
          <span>
            <strong className="text-slate-200">{actorName}</strong> removed{' '}
            <strong className="text-red-400">{meta.removedUserName || 'a user'}</strong> from the album.
          </span>
        );
      case 'image_deleted':
        const imgName = meta.imageTitle ? ` "${meta.imageTitle}"` : ' a photo';
        return (
          <span>
            <strong className="text-slate-200">{actorName}</strong> deleted{imgName} from this album.
          </span>
        );
      default:
        return <span>Activity recorded by {actorName}.</span>;
    }
  };

  const formatTime = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return '—';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'upload':
        return (
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
        );
      case 'comment':
        return (
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        );
      case 'collaborator_added':
        return (
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        );
      case 'collaborator_removed':
        return (
          <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1H12v-1a6 6 0 00-6-6zm12 2h-6" />
            </svg>
          </div>
        );
      case 'image_deleted':
        return (
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-lg bg-slate-500/10 border border-slate-500/20 text-slate-400 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="glass rounded-2xl border border-white/5 p-6 space-y-6 max-w-xl mx-auto shadow-xl shadow-black/20 font-sans">
      <div>
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Album Activity Log
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Recent collaborator, upload, and comment events on this album.
        </p>
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="h-28 flex flex-col items-center justify-center text-center text-slate-500">
            {loading ? (
              <svg className="animate-spin w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <>
                <p className="text-xs font-semibold text-slate-400">No activity recorded</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Events will appear here as they occur.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {activities.map((act) => (
              <div 
                key={act._id} 
                className="flex items-start gap-3 bg-white/3 border border-white/5 rounded-xl p-3 text-xs"
              >
                {getActivityIcon(act.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-slate-300 leading-normal">{formatActivityText(act)}</p>
                  <p className="text-[9px] text-slate-500 mt-1 font-medium">{formatTime(act.createdAt)}</p>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {currentPage < totalPages && (
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="w-full py-2 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/5 text-slate-300 hover:text-white transition-all text-[11px] font-semibold flex items-center justify-center gap-1.5 h-[34px]"
              >
                {loading ? (
                  <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : 'Load More Activity'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
