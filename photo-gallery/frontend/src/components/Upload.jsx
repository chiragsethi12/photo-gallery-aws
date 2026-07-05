// src/components/Upload.jsx - Image upload panel with drag-and-drop and preview
import React, { useState, useRef, useCallback } from 'react';
import { uploadImage } from '../api/imageApi';

/**
 * Upload
 * Props:
 *   onUploadSuccess(newImage) - called after a successful upload
 */
const Upload = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile]   = useState(null);   // File object
  const [preview, setPreview]             = useState(null);   // Object URL for <img>
  const [uploading, setUploading]         = useState(false);
  const [progress, setProgress]           = useState(0);      // 0-100
  const [success, setSuccess]             = useState(false);
  const [error, setError]                 = useState(null);
  const [dragging, setDragging]           = useState(false);

  const fileInputRef = useRef(null);

  // ── File validation & selection ─────────────────────────────────────────
  const handleFile = useCallback((file) => {
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setError('Only JPEG and PNG files are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10 MB.');
      return;
    }

    setError(null);
    setSuccess(false);
    setSelectedFile(file);
    // Create a temporary browser URL for the preview image
    setPreview(URL.createObjectURL(file));
  }, []);

  const handleFileChange = (e) => handleFile(e.target.files[0]);

  // ── Drag and drop handlers ──────────────────────────────────────────────
  const handleDragOver  = (e) => { e.preventDefault(); setDragging(true);  };
  const handleDragLeave = (e) => { e.preventDefault(); setDragging(false); };
  const handleDrop      = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // ── Upload to backend ───────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);
    setError(null);
    setSuccess(false);

    try {
      const result = await uploadImage(selectedFile, setProgress);

      setSuccess(true);

      // Notify parent (App) to prepend this image to the gallery
      onUploadSuccess({
        publicId:     result.publicId,
        url:          result.url,
        createdAt:    result.createdAt || new Date().toISOString(),
        width:        result.width,
        height:       result.height,
        format:       result.format,
      });

      // Reset the form after a short delay so the user sees the success state
      setTimeout(() => {
        setSelectedFile(null);
        setPreview(null);
        setProgress(0);
        setSuccess(false);
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Clear selection ─────────────────────────────────────────────────────
  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setSuccess(false);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="glass rounded-2xl p-6 shadow-2xl shadow-black/40 border border-white/5">
      <h2 className="text-xl font-semibold text-white mb-1">Upload Photo</h2>
      <p className="text-sm text-slate-400 mb-5">JPEG or PNG · max 10 MB</p>

      {/* ── Drop Zone ──────────────────────────────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !selectedFile && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden
          ${dragging ? 'drop-zone-active' : 'border-white/10 hover:border-indigo-500/40'}
          ${selectedFile ? 'cursor-default' : 'cursor-pointer'}
          ${selectedFile ? 'h-auto' : 'h-44'}
        `}
      >
        {selectedFile && preview ? (
          /* ── Preview ───────────────────────────────────────────────── */
          <div className="p-4">
            <div className="relative group">
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-64 object-contain rounded-lg bg-black/30"
              />
              {/* Remove button */}
              {!uploading && (
                <button
                  onClick={(e) => { e.stopPropagation(); clearSelection(); }}
                  className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600/90 transition-all duration-200"
                  title="Remove"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>

            {/* File info */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span className="truncate max-w-[70%] font-medium text-slate-300">{selectedFile.name}</span>
              <span>{formatSize(selectedFile.size)}</span>
            </div>
          </div>
        ) : (
          /* ── Empty state ───────────────────────────────────────────── */
          <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300 ${dragging ? 'bg-indigo-500/20' : 'bg-white/5'}`}>
              <svg className={`w-7 h-7 transition-colors duration-300 ${dragging ? 'text-indigo-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">
                {dragging ? 'Drop your photo here' : 'Drag & drop or click to browse'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">JPEG, PNG up to 10 MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        onChange={handleFileChange}
        id="file-input"
      />

      {/* ── Upload Progress Bar ─────────────────────────────────────────── */}
      {uploading && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Uploading to Cloudinary…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Status Messages ─────────────────────────────────────────────── */}
      {success && (
        <div className="mt-3 flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Image uploaded successfully!
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* ── Upload / Select Button ────────────────────────────────────── */}
      <div className="mt-4 flex gap-3">
        {!selectedFile ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
            id="select-image-btn"
          >
            Select Image
          </button>
        ) : (
          <>
            <button
              onClick={clearSelection}
              disabled={uploading}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-all duration-200 disabled:opacity-50"
              id="clear-selection-btn"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-[2] py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              id="upload-btn"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Uploading…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                  </svg>
                  Upload to Cloudinary
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Upload;
