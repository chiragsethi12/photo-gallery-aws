// src/components/ShareModal.jsx - Popup dialog to configure passwords/expiry and display shareable links
import React, { useState } from 'react';
import { createShareLink } from '../api/imageApi';

const ShareModal = ({ resourceType, resourceId, onClose }) => {
  const [expiresInDays, setExpiresInDays] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShareUrl('');
    setCopied(false);

    try {
      const data = await createShareLink(resourceType, resourceId, expiresInDays, password);
      setShareUrl(data.url);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate share link.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="glass w-full max-w-md rounded-2xl border border-white/10 p-6 space-y-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          title="Close Modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M8.684 10.742L12 9.382l3.316 1.36m-6.632 2.68L12 14.618l3.316-1.36m-6.632-4.14a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm6.632 0a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM12 3v3m0 12v3" />
            </svg>
            Share {resourceType === 'album' ? 'Album' : 'Image'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Generate a secure public link to share this resource.
          </p>
        </div>

        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
            {error}
          </div>
        )}

        {!shareUrl ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="expires-days">
                Link Expiration (Optional)
              </label>
              <input
                id="expires-days"
                type="number"
                min="1"
                placeholder="Expires in N days (e.g. 7)"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                disabled={loading}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="share-password">
                Password Protection (Optional)
              </label>
              <input
                id="share-password"
                type="password"
                placeholder="Enter password to lock access"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 h-[38px]"
            >
              {loading ? 'Generating...' : 'Create Share Link'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Shareable Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs select-all focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className={`px-4 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center min-w-[70px] ${
                    copied
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 italic text-center">
              Anyone with this link can view this content. Keep it secure.
            </p>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all h-[38px]"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareModal;
