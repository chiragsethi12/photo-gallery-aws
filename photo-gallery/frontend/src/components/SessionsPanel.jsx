// src/components/SessionsPanel.jsx - Active sessions dashboard
import React, { useEffect, useState } from 'react';
import { fetchSessions, revokeSession } from '../api/imageApi';

const SessionsPanel = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revokingId, setRevokingId] = useState(null);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await fetchSessions();
      setSessions(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError('Failed to load active sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRevoke = async (id) => {
    try {
      setRevokingId(id);
      await revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to revoke session:', err);
      alert('Failed to revoke session. Please try again.');
    } finally {
      setRevokingId(null);
    }
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  // Helper to get a human-readable browser/OS from user agent
  const parseUserAgent = (ua) => {
    if (!ua) return 'Unknown Device';
    let os = 'Unknown OS';
    let browser = 'Unknown Browser';

    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edge')) browser = 'Edge';

    return `${browser} on ${os}`;
  };

  return (
    <div className="glass rounded-2xl border border-white/5 p-6 md:p-8 shadow-xl shadow-black/30 animate-fade-in max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Active Sessions</h2>
          <p className="text-xs text-slate-400 mt-1">Manage and revoke your active sessions on different devices and browsers.</p>
        </div>
        <button
          onClick={loadSessions}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button
            onClick={loadSessions}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all duration-200"
          >
            Retry
          </button>
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-slate-400 text-center py-12 text-sm">No active sessions found.</p>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition-all duration-200 gap-4"
            >
              <div className="flex items-start gap-3.5">
                {/* Device Icon */}
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{parseUserAgent(session.userAgent)}</h3>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-[11px] text-slate-400">
                    <span>Created: <strong>{formatDate(session.createdAt)}</strong></span>
                    <span className="hidden sm:inline text-white/10">|</span>
                    <span>Expires: <strong>{formatDate(session.expiresAt)}</strong></span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">Session ID: {session.id}</p>
                </div>
              </div>

              <button
                onClick={() => handleRevoke(session.id)}
                disabled={revokingId === session.id}
                className="self-start sm:self-center px-3.5 py-1.5 rounded-lg border border-red-500/30 hover:border-red-500/80 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-1.5 font-sans"
              >
                {revokingId === session.id ? (
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : 'Revoke'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionsPanel;
