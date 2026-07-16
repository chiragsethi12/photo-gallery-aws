// src/components/Upload.jsx - Premium upload experience
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { CheckCircle2, UploadCloud, XCircle } from 'lucide-react';
import { uploadImage } from "../api/imageApi";
import Badge from "./ui/Badge";

const Upload = ({
  onUploadSuccess,
  albums = [],
  onViewImage = null,
  activeAlbum = "",
}) => {
  const [tags, setTags] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState(activeAlbum || "");
  const [uploads, setUploads] = useState([]);
  const [isUploadingGlobal, setIsUploadingGlobal] = useState(false);

  const onDrop = (acceptedFiles, fileRejections) => {
    const rejectionUploads = (fileRejections || []).map((rej) => ({
      id: Math.random().toString(36).substring(7),
      filename: rej.file.name,
      progress: 0,
      status: "error",
      error: rej.errors[0]?.message || "File type not allowed.",
    }));

    if (rejectionUploads.length > 0) {
      setUploads((prev) => [...rejectionUploads, ...prev]);
    }

    if (acceptedFiles.length === 0) return;

    const newUploads = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      filename: file.name,
      progress: 0,
      status: "pending",
      error: null,
    }));

    setUploads((prev) => [...newUploads, ...prev]);
    setIsUploadingGlobal(true);

    const uploadPromises = newUploads.map(async (uploadItem) => {
      setUploads((prev) =>
        prev.map((item) =>
          item.id === uploadItem.id ? { ...item, status: "uploading" } : item,
        ),
      );

      try {
        const result = await uploadImage(
          uploadItem.file,
          {
            title: uploadItem.filename.replace(/\.[^/.]+$/, ""),
            tags: tags,
            album: selectedAlbum,
          },
          (pct) => {
            setUploads((prev) =>
              prev.map((item) =>
                item.id === uploadItem.id ? { ...item, progress: pct } : item,
              ),
            );
          },
        );

        setUploads((prev) =>
          prev.map((item) =>
            item.id === uploadItem.id
              ? { ...item, status: "success", progress: 100 }
              : item,
          ),
        );
        onUploadSuccess(result);
      } catch (err) {
        const errMsg = err.response?.data?.error || "Upload failed.";
        const isConflict = err.response?.status === 409;
        const existingImage = err.response?.data?.existingImage;

        setUploads((prev) =>
          prev.map((item) =>
            item.id === uploadItem.id
              ? {
                  ...item,
                  status: "error",
                  error: errMsg,
                  isConflict,
                  existingImage,
                }
              : item,
          ),
        );
      }
    });

    Promise.all(uploadPromises).then(() => {
      setIsUploadingGlobal(false);
      setTimeout(() => {
        setUploads((prev) => prev.filter((item) => item.status === "error"));
      }, 5000);
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/jpg": [], "image/png": [] },
    maxSize: 10 * 1024 * 1024,
  });

  const clearErrors = () =>
    setUploads((prev) => prev.filter((item) => item.status !== "error"));

  return (
    <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
            Upload
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            Drop in fresh photos
          </h2>
        </div>
        <Badge theme="accent">PNG · JPG</Badge>
      </div>
      <p className="mt-2 text-sm text-slate-400">
        Share high-quality images in a few clicks. Add tags, place them in an
        album, and keep your library tidy.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="upload-album"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Album
          </label>
          <select
            id="upload-album"
            value={selectedAlbum}
            onChange={(e) => setSelectedAlbum(e.target.value)}
            disabled={isUploadingGlobal}
            className="input-shell"
          >
            <option value="" className="bg-slate-950">
              Choose an album (optional)
            </option>
            {albums.map((alb) => (
              <option key={alb._id} value={alb._id} className="bg-slate-950">
                {alb.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="upload-tags"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Tags
          </label>
          <input
            id="upload-tags"
            type="text"
            placeholder="summer, travel, beach"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            disabled={isUploadingGlobal}
            className="input-shell"
          />
        </div>

        <div
          {...getRootProps()}
          className={`rounded-[24px] border-2 border-dashed p-6 text-center transition-all ${isDragActive ? "border-emerald-400 bg-emerald-500/10" : "border-slate-700 bg-slate-950/40 hover:border-emerald-400/40"}`}
        >
          <input {...getInputProps()} />
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-medium text-white">
            {isDragActive
              ? "Drop your files now"
              : "Drop files here or click to browse"}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            JPEG or PNG · up to 10 MB each
          </p>
        </div>
      </div>

      {uploads.length > 0 ? (
        <div className="mt-5 space-y-2.5">
          {uploads.some((item) => item.status === "error") ? (
            <div className="flex items-center justify-between text-sm text-rose-300">
              <span>Some uploads need attention</span>
              <button
                onClick={clearErrors}
                className="font-medium hover:text-rose-200"
              >
                Clear failed
              </button>
            </div>
          ) : null}

          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className="truncate text-sm font-medium text-slate-200"
                  title={upload.filename}
                >
                  {upload.filename}
                </span>
                {upload.status === "uploading" ? (
                  <span className="text-sm text-emerald-300">
                    {upload.progress}%
                  </span>
                ) : null}
                {upload.status === "success" ? (
                  <span className="flex items-center gap-1 text-sm text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" /> Done
                  </span>
                ) : null}
                {upload.status === "error" ? (
                  <span className="flex items-center gap-1 text-sm text-rose-300">
                    <XCircle className="h-4 w-4" /> Failed
                  </span>
                ) : null}
              </div>
              {upload.status === "uploading" ? (
                <div className="mt-3 h-2 rounded-full bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              ) : null}
              {upload.error ? (
                <p className="mt-2 text-sm text-rose-300">{upload.error}</p>
              ) : null}
              {upload.isConflict && upload.existingImage && onViewImage ? (
                <button
                  onClick={() => onViewImage(upload.existingImage)}
                  className="mt-2 text-sm font-medium text-emerald-300 underline"
                >
                  View existing image
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default Upload;
