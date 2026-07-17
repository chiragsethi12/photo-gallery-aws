// src/components/TrashView.jsx - Glassmorphic dashboard to manage soft-deleted assets
import React, { useEffect, useState } from 'react';
import { RefreshCcw, Trash2, Undo2, AlertTriangle, ShieldAlert } from 'lucide-react';
import SectionHeader from './ui/SectionHeader';
import EmptyState from './ui/EmptyState';
import Button from './ui/Button';
import ConfirmDialog from './ui/ConfirmDialog';
import useToast from '../hooks/useToast';
import { emptyTrash } from '../api/imageApi';

const TrashView = ({
  trashImages = [],
  trashAlbums = [],
  loading,
  loadTrash,
  restoreImage,
  restoreAlbum,
  permanentlyDeleteImage,
  permanentlyDeleteAlbum
}) => {
  const toast = useToast();
  const [confirmingImage, setConfirmingImage] = useState(null);
  const [confirmingAlbum, setConfirmingAlbum] = useState(null);
  const [showEmptyTrashConfirm, setShowEmptyTrashConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  const handleRestoreImage = async (id) => {
    try {
      setActionLoading(true);
      await restoreImage(id);
      toast.success('Photo restored successfully.');
    } catch (err) {
      toast.error('Failed to restore photo.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreAlbum = async (id) => {
    try {
      setActionLoading(true);
      await restoreAlbum(id);
      toast.success('Album restored successfully.');
    } catch (err) {
      toast.error('Failed to restore album.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentlyDeleteImage = async (id) => {
    try {
      setActionLoading(true);
      await permanentlyDeleteImage(id);
      setConfirmingImage(null);
      toast.success('Photo permanently deleted.');
    } catch (err) {
      toast.error('Failed to permanently delete photo.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentlyDeleteAlbum = async (id) => {
    try {
      setActionLoading(true);
      await permanentlyDeleteAlbum(id);
      setConfirmingAlbum(null);
      toast.success('Album permanently deleted.');
    } catch (err) {
      toast.error('Failed to permanently delete album.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmptyTrash = async () => {
    try {
      setActionLoading(true);
      await emptyTrash();
      await loadTrash();
      setShowEmptyTrashConfirm(false);
      toast.success('Trash emptied successfully.');
    } catch (err) {
      toast.error('Failed to empty trash bin.');
    } finally {
      setActionLoading(false);
    }
  };

  const getRemainingDays = (deletedAt) => {
    if (!deletedAt) return 30;
    const deletedDate = new Date(deletedAt);
    const expireDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffMs = expireDate - now;
    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    return Math.max(0, diffDays);
  };

  if (loading && trashImages.length === 0 && trashAlbums.length === 0) {
    return (
      <div className="space-y-4">
        <SectionHeader
          title="Trash Bin"
          subtitle="Loading trashed files…"
          icon={Trash2}
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="skeleton aspect-square rounded-[24px]"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const hasItems = trashImages.length > 0 || trashAlbums.length > 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Trash Bin"
        subtitle="Items will be permanently deleted automatically after 30 days."
        icon={Trash2}
        actions={
          hasItems ? [
            <Button
              key="refresh"
              variant="secondary"
              size="sm"
              onClick={loadTrash}
              disabled={actionLoading}
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>,
            <Button
              key="empty"
              variant="danger"
              size="sm"
              onClick={() => setShowEmptyTrashConfirm(true)}
              disabled={actionLoading}
            >
              <Trash2 className="h-4 w-4" /> Empty trash
            </Button>
          ] : [
            <Button
              key="refresh"
              variant="secondary"
              size="sm"
              onClick={loadTrash}
              disabled={actionLoading}
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
          ]
        }
      />

      {!hasItems ? (
        <EmptyState
          icon={Trash2}
          title="Trash bin is empty"
          description="Deleted images and albums are kept here safely for 30 days before permanent deletion."
        />
      ) : (
        <div className="space-y-10">
          {/* --- Soft-deleted Albums --- */}
          {trashAlbums.length > 0 && (
            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Trashed Albums</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {trashAlbums.map((album) => (
                  <div key={album._id} className="flex flex-col justify-between rounded-[24px] border border-slate-800 bg-slate-900/70 p-4">
                    <div>
                      <h4 className="text-sm font-semibold text-white truncate">{album.name}</h4>
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2">{album.description || 'No description'}</p>
                      <span className="inline-block mt-3 text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded-full font-medium">
                        Permanently deleted in {getRemainingDays(album.deletedAt)} days
                      </span>
                    </div>

                    <div className="flex gap-2 mt-4 pt-3 border-t border-slate-800">
                      <Button
                        onClick={() => handleRestoreAlbum(album._id)}
                        disabled={actionLoading}
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                      >
                        <Undo2 className="h-3.5 w-3.5" /> Restore
                      </Button>

                      <Button
                        onClick={() => setConfirmingAlbum(album._id)}
                        variant="danger"
                        size="sm"
                        className="flex-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete Forever
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- Soft-deleted Images --- */}
          {trashImages.length > 0 && (
            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Trashed Photos</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {trashImages.map((image) => (
                  <div key={image._id} className="group relative overflow-hidden rounded-[24px] border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
                    <div className="aspect-square relative overflow-hidden bg-slate-950">
                      <img
                        src={image.url}
                        alt={image.title || 'Trashed'}
                        className="w-full h-full object-cover opacity-75 group-hover:opacity-90 transition-opacity"
                        loading="lazy"
                      />
                      <span className="absolute bottom-2 left-2 text-[10px] bg-slate-950/80 backdrop-blur border border-slate-800 text-rose-300 px-2.5 py-0.5 rounded-full font-semibold shadow-lg">
                        {getRemainingDays(image.deletedAt)}d left
                      </span>
                    </div>

                    <div className="p-3">
                      <p className="text-xs font-semibold text-white truncate" title={image.title || 'Untitled'}>
                        {image.title || 'Untitled'}
                      </p>
                      
                      <div className="flex gap-2 mt-3 pt-2 border-t border-slate-800">
                        <Button
                          onClick={() => handleRestoreImage(image._id)}
                          disabled={actionLoading}
                          variant="secondary"
                          size="sm"
                          className="flex-1 px-1 py-1"
                        >
                          Restore
                        </Button>

                        <Button
                          onClick={() => setConfirmingImage(image._id)}
                          variant="danger"
                          size="sm"
                          className="flex-1 px-1 py-1"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- Confirm Dialogs --- */}
      <ConfirmDialog
        open={confirmingImage !== null}
        title="Permanently Delete Photo?"
        message="This action is permanent and cannot be undone. The photo file and metadata will be destroyed."
        confirmLabel="Delete permanently"
        danger
        loading={actionLoading}
        onConfirm={() => handlePermanentlyDeleteImage(confirmingImage)}
        onCancel={() => setConfirmingImage(null)}
      />

      <ConfirmDialog
        open={confirmingAlbum !== null}
        title="Permanently Delete Album?"
        message="This will permanently delete this album. Images inside the album will not be deleted but will no longer be grouped."
        confirmLabel="Delete album"
        danger
        loading={actionLoading}
        onConfirm={() => handlePermanentlyDeleteAlbum(confirmingAlbum)}
        onCancel={() => setConfirmingAlbum(null)}
      />

      <ConfirmDialog
        open={showEmptyTrashConfirm}
        title="Empty Trash Bin?"
        message="This will permanently delete all photos and albums currently in the trash. This action is absolute and irreversible."
        confirmLabel="Empty trash bin"
        danger
        loading={actionLoading}
        onConfirm={handleEmptyTrash}
        onCancel={() => setShowEmptyTrashConfirm(false)}
      />
    </div>
  );
};

export default TrashView;
