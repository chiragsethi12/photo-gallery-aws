// src/components/Upload.jsx - Image upload panel with multi-file drag-and-drop parallel uploads
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadImage } from '../api/imageApi';

/**
 * Upload
 * Props:
 *   onUploadSuccess(newImage) - called after each successful upload
 *   albums - Array of user albums to select from
 */
const Upload = ({ onUploadSuccess, albums = [] }) => {
  const [tags, setTags] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState('');
  const [uploads, setUploads] = useState([]); // Array of { id, filename, progress, status, error }
  const [isUploadingGlobal, setIsUploadingGlobal] = useState(false);

  // ── Drag & Drop configuration ───────────────────────────────────────────
  const onDrop = (acceptedFiles, fileRejections) => {
    // Handle rejected files (e.g. wrong format, too large)
    const rejectionUploads = (fileRejections || []).map((rej) => ({
      id: Math.random().toString(36).substring(7),
      filename: rej.file.name,
      progress: 0,
      status: 'error',
      error: rej.errors[0]?.message || 'File type not allowed.',
    }));

    if (rejectionUploads.length > 0) {
      setUploads((prev) => [...rejectionUploads, ...prev]);
    }

    if (acceptedFiles.length === 0) return;

    // Build the array of uploads
    const newUploads = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      filename: file.name,
      progress: 0,
      status: 'pending',
      error: null,
    }));

    setUploads((prev) => [...newUploads, ...prev]);
    setIsUploadingGlobal(true);

    // Upload in parallel
    const uploadPromises = newUploads.map(async (uploadItem) => {
      // Set status to uploading
      setUploads((prev) =>
        prev.map((item) => (item.id === uploadItem.id ? { ...item, status: 'uploading' } : item))
      );

      try {
        // Run API upload
        const result = await uploadImage(
          uploadItem.file,
          {
            title: uploadItem.filename.replace(/\.[^/.]+$/, ""), // Strip file extension for default title
            tags: tags,
            album: selectedAlbum,
          },
          (pct) => {
            // Update individual progress callback
            setUploads((prev) =>
              prev.map((item) => (item.id === uploadItem.id ? { ...item, progress: pct } : item))
            );
          }
        );

        // Mark individual success
        setUploads((prev) =>
          prev.map((item) => (item.id === uploadItem.id ? { ...item, status: 'success', progress: 100 } : item))
        );

        // Prepend directly to gallery immediately
        onUploadSuccess(result);
      } catch (err) {
        console.error('File upload error:', err);
        const errMsg = err.response?.data?.error || 'Upload failed.';
        setUploads((prev) =>
          prev.map((item) => (item.id === uploadItem.id ? { ...item, status: 'error', error: errMsg } : item))
        );
      }
    });

    // Reset general upload loading bar after everything finishes
    Promise.all(uploadPromises).then(() => {
      setIsUploadingGlobal(false);
      // Wait a moment then clear success cards so the view stays uncluttered
      setTimeout(() => {
        setUploads((prev) => prev.filter((item) => item.status === 'error'));
      }, 5000);
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/jpg': [],
      'image/png': [],
    },
    maxSize: 10 * 1024 * 1024, // 10 MB
  });

  const clearErrors = () => {
    setUploads((prev) => prev.filter((item) => item.status !== 'error'));
  };

  return (
    <div className="glass rounded-2xl p-6 shadow-2xl shadow-black/40 border border-white/5 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Upload Photo</h2>
        <p className="text-xs text-slate-400">JPEG or PNG · max 10 MB per file</p>
      </div>

      {/* ── Metadata settings ────────────────────────────────────────────── */}
      <div className="space-y-3.5 pt-1">
        {/* Album Select */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="upload-album">
            Add to Album
          </label>
          <select
            id="upload-album"
            value={selectedAlbum}
            onChange={(e) => setSelectedAlbum(e.target.value)}
            disabled={isUploadingGlobal}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200 cursor-pointer"
          >
            <option value="" className="bg-[#0b1424]">Select Album (Optional)</option>
            {albums.map((alb) => (
              <option key={alb._id} value={alb._id} className="bg-[#0b1424]">
                {alb.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags input */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="upload-tags">
            Tags (comma-separated)
          </label>
          <input
            id="upload-tags"
            type="text"
            placeholder="e.g. summer, travel, beach"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            disabled={isUploadingGlobal}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
          />
        </div>
      </div>

      {/* ── Drag & Drop Area ───────────────────────────────────────────── */}
      <div
        {...getRootProps()}
        className={`
          relative rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer h-36 flex flex-col items-center justify-center p-4 text-center
          ${isDragActive ? 'drop-zone-active border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-indigo-500/40'}
          ${isUploadingGlobal ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} id="file-dropzone-input" />
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-2.5">
          <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
        </div>
        <p className="text-xs font-semibold text-slate-300">
          {isDragActive ? 'Drop your photos here' : 'Drag & drop photos, or click to browse'}
        </p>
      </div>

      {/* ── Individual Upload Progress Bars ──────────────────────────────── */}
      {uploads.length > 0 && (
        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {uploads.some((u) => u.status === 'error') && (
            <div className="flex justify-between items-center text-[10px] text-red-400 font-bold mb-1">
              <span>Some uploads failed</span>
              <button onClick={clearErrors} className="hover:underline">Clear Failed</button>
            </div>
          )}
          
          {uploads.map((upload) => (
            <div key={upload.id} className="p-3 bg-white/3 border border-white/5 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between items-center text-slate-300">
                <span className="truncate max-w-[70%] font-medium" title={upload.filename}>
                  {upload.filename}
                </span>
                
                {upload.status === 'uploading' && (
                  <span className="text-[10px] text-indigo-400 font-bold">{upload.progress}%</span>
                )}
                {upload.status === 'success' && (
                  <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Done
                  </span>
                )}
                {upload.status === 'error' && (
                  <span className="text-[10px] text-red-400 font-bold">Failed</span>
                )}
              </div>

              {/* Progress Loading Bar */}
              {upload.status === 'uploading' && (
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}

              {/* Error messages */}
              {upload.error && (
                <p className="text-[10px] text-red-400 line-clamp-1">{upload.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Upload;
