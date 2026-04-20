// src/components/Navbar.jsx - Top navigation bar
import React from 'react';

/**
 * Navbar
 * Displays the app brand and a refresh button.
 * onRefresh is passed down from App to re-fetch the gallery.
 */
const Navbar = ({ onRefresh, imageCount }) => (
  <header className="sticky top-0 z-50 glass border-b border-white/5 shadow-xl shadow-black/30">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">

        {/* ── Brand ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Camera icon */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text leading-tight">CloudSnap</h1>
            <p className="text-[10px] text-slate-500 leading-none hidden sm:block">Photo Gallery · AWS S3</p>
          </div>
        </div>

        {/* ── Stats & Actions ───────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Image count badge */}
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <svg className="w-3.5 h-3.5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
            </svg>
            {imageCount} {imageCount === 1 ? 'photo' : 'photos'}
          </span>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            title="Refresh gallery"
            className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 px-3 py-1.5 rounded-xl transition-all duration-200 group"
          >
            <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

      </div>
    </div>
  </header>
);

export default Navbar;
