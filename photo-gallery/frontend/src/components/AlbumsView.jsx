// src/components/AlbumsView.jsx - Premium album workspace
import React, { useState } from "react";
import { FolderPlus, Share2, Sparkles, Trash2 } from "lucide-react";
import ShareModal from "./ShareModal";
import { createAlbum } from "../api/imageApi";
import SectionHeader from "./ui/SectionHeader";
import EmptyState from "./ui/EmptyState";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import ConfirmDialog from "./ui/ConfirmDialog";
import useToast from "../hooks/useToast";

const AlbumsView = ({
  albums,
  loading,
  albumScope,
  onSelectAlbum,
  onRefreshAlbums,
  currentUser,
  onDeleteAlbum,
}) => {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareResourceId, setShareResourceId] = useState(null);
  const [shareResourceType, setShareResourceType] = useState("album");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  
  // Album delete states
  const [albumToDelete, setAlbumToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Album name is required.");
      return;
    }

    setCreating(true);
    setError("");

    try {
      await createAlbum({ name, description });
      setName("");
      setDescription("");
      setShowModal(false);
      onRefreshAlbums();
      toast.success("Album created successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create album.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAlbumConfirm = async () => {
    if (!albumToDelete) return;
    setDeleteLoading(true);
    try {
      await onDeleteAlbum(albumToDelete);
      toast.success("Album moved to Trash.");
      onRefreshAlbums();
    } catch (err) {
      toast.error("Failed to delete album.");
    } finally {
      setDeleteLoading(false);
      setAlbumToDelete(null);
    }
  };

  if (loading && albums.length === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="skeleton aspect-[4/3] rounded-[24px]"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Albums"
        subtitle={`${albums.length} curated collections ready to share`}
        actions={[
          <Button
            key="new"
            variant="primary"
            size="sm"
            onClick={() => setShowModal(true)}
          >
            <FolderPlus className="h-4 w-4" /> New album
          </Button>,
        ]}
      />

      <div className="flex flex-wrap gap-2">
        {["all", "mine", "shared"].map((scope) => (
          <button
            key={scope}
            onClick={() => onRefreshAlbums(scope)}
            className={`rounded-full px-3.5 py-2 text-sm font-medium transition-all ${albumScope === scope ? "bg-emerald-500 text-slate-950" : "border border-slate-800 bg-slate-900/70 text-slate-400 hover:text-white"}`}
          >
            {scope === "all"
              ? "All albums"
              : scope === "mine"
                ? "My albums"
                : "Shared with me"}
          </button>
        ))}
      </div>

      {albums.length === 0 ? (
        <EmptyState
          title="No albums yet"
          description="Create a collection to keep related memories together and share them effortlessly."
          action={
            <Button variant="primary" onClick={() => setShowModal(true)}>
              Create your first album
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {albums.map((album) => {
            const isOwner =
              album.createdBy &&
              currentUser &&
              (album.createdBy === currentUser.id ||
                (album.createdBy._id &&
                  album.createdBy._id === currentUser.id));
            const collabRecord = album.collaborators?.find(
              (c) => (c.user?._id || c.user) === currentUser?.id,
            );
            const isContributor = collabRecord?.role === "contributor";
            const canShare = isOwner || isContributor;

            return (
              <div
                key={album._id}
                onClick={() => onSelectAlbum(album._id)}
                className="group relative flex aspect-[4/3] cursor-pointer flex-col justify-end overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900/70 p-4 transition-all hover:-translate-y-1 hover:border-emerald-400/40"
              >
                <div className="absolute right-3 top-3 z-20 flex gap-2">
                  {canShare ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareResourceId(album._id);
                        setShareResourceType("album");
                        setShowShareModal(true);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-950/70 text-slate-300 transition-all hover:border-emerald-400/40 hover:text-white"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  ) : null}
                  {isOwner ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAlbumToDelete(album._id);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-950/70 text-slate-300 transition-all hover:border-rose-400/40 hover:text-rose-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <div className="absolute inset-0 overflow-hidden">
                  {album.coverImage ? (
                    <img
                      src={album.coverImage}
                      alt={album.name}
                      className="h-full w-full object-cover opacity-70 transition-all duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-950/70">
                      <Sparkles className="h-12 w-12 text-slate-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">
                      {album.name}
                    </h3>
                    {album.shared ? <Badge theme="accent">Shared</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {album.description ||
                      "A clean collection of meaningful moments."}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                    <span>
                      {album.imageCount}{" "}
                      {album.imageCount === 1 ? "photo" : "photos"}
                    </span>
                    <span>Updated recently</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-slate-800 bg-slate-900/95 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
                  Create
                </p>
                <h3 className="mt-1 text-xl font-semibold text-white">
                  New album
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-950/70 text-slate-300"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateAlbum} className="mt-5 space-y-4">
              {error ? (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                  {error}
                </div>
              ) : null}
              <div>
                <label
                  htmlFor="album-name"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Album name
                </label>
                <input
                  id="album-name"
                  type="text"
                  placeholder="Summer trip 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-shell"
                  disabled={creating}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="album-desc"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Description
                </label>
                <textarea
                  id="album-desc"
                  rows="3"
                  placeholder="What belongs in this collection?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-shell resize-none"
                  disabled={creating}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  type="button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  type="submit"
                  disabled={creating}
                >
                  {creating ? "Creating…" : "Create album"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showShareModal ? (
        <ShareModal
          resourceType={shareResourceType}
          resourceId={shareResourceId}
          onClose={() => {
            setShowShareModal(false);
            setShareResourceId(null);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={albumToDelete !== null}
        title="Delete Album?"
        message="Are you sure you want to delete this album? Photos inside the album will not be deleted but they will be removed from the album workspace."
        confirmLabel="Move to Trash"
        cancelLabel="Cancel"
        danger
        loading={deleteLoading}
        onConfirm={handleDeleteAlbumConfirm}
        onCancel={() => setAlbumToDelete(null)}
      />
    </div>
  );
};

export default AlbumsView;
