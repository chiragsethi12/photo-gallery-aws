// src/components/Navbar.jsx - Top navigation bar with search and navigation tabs
import React from 'react';

/**
 * Navbar
 * Displays the app brand, search field, view tabs, active user status, and action buttons.
 */
const Navbar = ({
  onRefresh,
  imageCount,
  user,
  onLogout,
  viewMode = 'photos',
  onViewModeChange,
  searchQuery = '',
  onSearchChange,
}) => {
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearchChange(e.target.value);
    }
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/5 shadow-xl shadow-black/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 md:py-0 md:h-16 gap-3">

          {/* ── Brand & Tabs ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between md:justify-start gap-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onViewModeChange('photos')}>
              {/* Camera icon */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text leading-tight">CloudSnap</h1>
                <p className="text-[10px] text-slate-500 leading-none hidden sm:block">MongoDB Persisted Storage</p>
              </div>
            </div>

            {/* View Mode Switching Tabs */}
            {user && (
              <nav className="flex bg-white/5 p-1 rounded-xl border border-white/10" aria-label="Gallery View Toggle">
                <button
                  onClick={() => onViewModeChange('photos')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    viewMode === 'photos'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  aria-pressed={viewMode === 'photos'}
                >
                  Photos
                </button>
                <button
                  onClick={() => onViewModeChange('albums')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    viewMode === 'albums'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  aria-pressed={viewMode === 'albums'}
                >
                  Albums
                </button>
              </nav>
            )}
          </div>

          {/* ── Search & User controls ────────────────────────────────────── */}
          <div className="flex items-center justify-between md:justify-end gap-3.5 flex-1">
            {/* Search Input Box */}
            {user && (
              <div className="relative flex-1 max-w-xs md:max-w-md lg:max-w-sm">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search photos by title or tag..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* User info display */}
              {user && (
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-white/3 border border-white/5 px-3 py-1.5 rounded-full">
                  <span className="font-medium text-slate-300">Logged in as <strong className="text-white">{user.name}</strong></span>
                  <span className="text-white/10">|</span>
                  <button
                    onClick={onLogout}
                    className="font-bold text-red-400 hover:text-red-300 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}

              {/* Refresh button */}
              <button
                onClick={onRefresh}
                title="Refresh items"
                className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 px-3 py-1.5 rounded-xl transition-all duration-200 group"
              >
                <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                <span className="hidden lg:inline">Refresh</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
