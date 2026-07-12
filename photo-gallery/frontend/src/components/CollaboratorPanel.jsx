// src/components/CollaboratorPanel.jsx - Control dashboard for album owners to manage permissions
import React, { useState } from 'react';
import { addCollaborator, removeCollaborator, updateCollaborator } from '../api/imageApi';

const CollaboratorPanel = ({ albumId, collaborators, onRefreshAlbum }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await addCollaborator(albumId, email.trim(), role);
      setEmail('');
      setSuccess('Collaborator added successfully!');
      onRefreshAlbum();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add collaborator.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await removeCollaborator(albumId, userId);
      setSuccess('Collaborator removed successfully!');
      onRefreshAlbum();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove collaborator.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await updateCollaborator(albumId, userId, newRole);
      setSuccess('Collaborator role updated successfully!');
      onRefreshAlbum();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl border border-white/5 p-6 space-y-6 max-w-xl mx-auto shadow-xl shadow-black/20 font-sans">
      <div>
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Manage Collaborators
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Share this album with other registered users by email.
        </p>
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
          {error}
        </div>
      )}

      {success && (
        <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5">
          {success}
        </div>
      )}

      {/* Add collaborator form */}
      <form onSubmit={handleAdd} className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="collab-email">
            User Email
          </label>
          <input
            id="collab-email"
            type="email"
            placeholder="collab@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-all duration-200"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="collab-role">
            Role
          </label>
          <select
            id="collab-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 transition-all duration-200"
          >
            <option value="viewer">Viewer</option>
            <option value="contributor">Contributor</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 h-[38px] flex items-center justify-center"
        >
          Add
        </button>
      </form>

      {/* Collaborators list */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-white/5 pb-2">
          Current Access ({collaborators.length})
        </h4>

        {collaborators.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2 text-center">No collaborators added yet.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {collaborators.map((c) => (
              <div key={c._id || (c.user && c.user._id)} className="flex items-center justify-between bg-white/3 border border-white/5 rounded-xl p-3">
                <div className="min-w-0 flex-1 mr-4">
                  <p className="text-xs font-bold text-white truncate">{c.user?.name || 'Unknown'}</p>
                  <p className="text-[10px] text-slate-400 truncate">{c.user?.email || 'N/A'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={c.role}
                    onChange={(e) => handleRoleChange(c.user?._id, e.target.value)}
                    disabled={loading}
                    className="bg-transparent border-0 text-[11px] font-medium text-indigo-400 focus:outline-none cursor-pointer"
                  >
                    <option value="viewer" className="bg-slate-950 text-white">Viewer</option>
                    <option value="contributor" className="bg-slate-950 text-white">Contributor</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRemove(c.user?._id)}
                    disabled={loading}
                    className="w-7 h-7 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors"
                    title="Revoke Access"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaboratorPanel;
