// src/components/Gallery.jsx - Premium gallery experience with selection, shortcuts, and infinite scroll
import React, { useEffect, useMemo, useState } from "react";
import { Check, Download, Heart, Trash2, X } from "lucide-react";
import ImageCard from "./ImageCard";
import Lightbox from "./Lightbox";
import ShareModal from "./ShareModal";
import SectionHeader from "./ui/SectionHeader";
import EmptyState from "./ui/EmptyState";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

const Gallery = ({
  images,
  totalPages = 1,
  currentPage = 1,
  onPageChange,
  totalImages = 0,
  loading,
  error,
  deleting,
  onDelete,
  onRetry,
  currentUser,
  toggleFavorite,
  selectedAlbum = "",
  selectedTag = "",
  onClearAlbumFilter,
  onClearTagFilter,
  onTagClick,
  albums = [],
  activeAlbumRole = null,
  socket = null,
  dateFrom = "",
  dateTo = "",
  sort = "newest",
  onDateRangeChange = () => {},
  onSortChange = () => {},
}) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareResourceId, setShareResourceId] = useState(null);
  const [selectedImageIds, setSelectedImageIds] = useState([]);

  const handleShareImage = (imageId) => {
    setShareResourceId(imageId);
    setShowShareModal(true);
  };

  const handleNavigateLightbox = (direction) => {
    if (direction === "next") {
      setSelectedIndex((prev) => (prev + 1) % images.length);
    } else {
      setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const activeAlbumObj = useMemo(
    () => albums.find((a) => a._id === selectedAlbum),
    [albums, selectedAlbum],
  );
  const activeAlbumName = activeAlbumObj
    ? activeAlbumObj.name
    : "Selected Album";

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedImageIds([]);
        setSelectedIndex(null);
      }

      if (event.key === "Delete" && selectedImageIds.length > 0) {
        event.preventDefault();
        selectedImageIds.forEach((id) => onDelete(id));
        setSelectedImageIds([]);
      }

      if (
        selectedIndex !== null &&
        (event.key === "ArrowRight" || event.key === "ArrowLeft")
      ) {
        event.preventDefault();
        handleNavigateLightbox(event.key === "ArrowRight" ? "next" : "prev");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedImageIds, selectedIndex, onDelete]);

  useEffect(() => {
    const onScroll = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 320;
      if (nearBottom && currentPage < totalPages && !loading) {
        onPageChange(currentPage + 1);
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [currentPage, totalPages, loading, onPageChange]);

  const toggleSelection = (imageId) => {
    setSelectedImageIds((prev) =>
      prev.includes(imageId)
        ? prev.filter((id) => id !== imageId)
        : [...prev, imageId],
    );
  };

  const selectAllVisible = () => {
    setSelectedImageIds(images.map((image) => image.publicId));
  };

  const clearSelection = () => setSelectedImageIds([]);

  const handleBulkFavorite = () => {
    selectedImageIds.forEach((id) => {
      const image = images.find((item) => item.publicId === id);
      if (image && toggleFavorite) {
        toggleFavorite(image._id, currentUser);
      }
    });
    setSelectedImageIds([]);
  };

  const handleBulkDelete = () => {
    selectedImageIds.forEach((id) => onDelete(id));
    setSelectedImageIds([]);
  };

  if (loading && (!images || images.length === 0)) {
    return (
      <section className="space-y-4">
        <SectionHeader title="Gallery" subtitle="Loading your latest images" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="skeleton aspect-square rounded-[24px]"
              style={{ animationDelay: `${i * 70}ms` }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4">
        <SectionHeader
          title="Gallery"
          subtitle="A quick retry can bring things back online"
        />
        <EmptyState
          title="We hit a snag"
          description={error}
          action={
            <Button variant="primary" onClick={onRetry}>
              Try again
            </Button>
          }
        />
      </section>
    );
  }

  if (!images || images.length === 0) {
    return (
      <section className="space-y-4">
        <SectionHeader
          title="Gallery"
          subtitle={
            selectedAlbum || selectedTag
              ? "Adjust the current filter to uncover more photos."
              : "Upload your first images and the gallery will appear here."
          }
        />
        {(selectedAlbum || selectedTag) && (
          <div className="flex flex-wrap gap-2">
            {selectedAlbum ? (
              <Badge theme="accent">Album · {activeAlbumName}</Badge>
            ) : null}
            {selectedTag ? (
              <Badge theme="warning">Tag · {selectedTag}</Badge>
            ) : null}
          </div>
        )}
        <EmptyState
          title="No photos yet"
          description={
            selectedAlbum || selectedTag
              ? "Clear the current filters to view the rest of your collection."
              : "Start by uploading a few files or create a new album to organize them."
          }
          action={
            selectedAlbum || selectedTag ? (
              <Button
                variant="secondary"
                onClick={() => {
                  onClearAlbumFilter();
                  onClearTagFilter();
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button variant="primary" onClick={() => {}}>
                Upload photos
              </Button>
            )
          }
        />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="font-medium text-white">
                {totalImages} images
              </span>
              <span>·</span>
              <span>
                {sort === "newest"
                  ? "Newest first"
                  : sort === "oldest"
                    ? "Oldest first"
                    : "A–Z"}
              </span>
            </div>
            {dateFrom || dateTo ? (
              <Badge theme="warning">Filtered by date</Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedImageIds.length > 0 ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBulkFavorite}
                >
                  <Heart className="h-4 w-4" /> Favorite
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  <X className="h-4 w-4" /> Clear
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={selectAllVisible}
                >
                  <Check className="h-4 w-4" /> Select all
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onDateRangeChange("", "");
                  }}
                  className={dateFrom || dateTo ? "" : "opacity-60"}
                >
                  Reset dates
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateRangeChange(e.target.value, dateTo)}
                className="input-shell w-auto px-2.5 py-2 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => onDateRangeChange(dateFrom, e.target.value)}
                className="input-shell w-auto px-2.5 py-2 text-xs"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Sort</span>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              className="input-shell w-auto px-2.5 py-2 text-xs"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      </div>

      {(selectedAlbum || selectedTag) && (
        <div className="flex flex-wrap gap-2">
          {selectedAlbum ? (
            <Badge theme="accent">Album · {activeAlbumName}</Badge>
          ) : null}
          {selectedTag ? (
            <Badge theme="warning">Tag · {selectedTag}</Badge>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {images.map((image, index) => (
          <ImageCard
            key={image.publicId}
            image={image}
            onDelete={onDelete}
            deleting={deleting === image.publicId}
            onClick={() => setSelectedIndex(index)}
            currentUser={currentUser}
            toggleFavorite={toggleFavorite}
            onTagClick={onTagClick}
            activeAlbumRole={activeAlbumRole}
            onShare={handleShareImage}
            selected={selectedImageIds.includes(image.publicId)}
            onToggleSelect={() => toggleSelection(image.publicId)}
          />
        ))}
      </div>

      {selectedIndex !== null ? (
        <Lightbox
          images={images}
          selectedIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onNavigate={handleNavigateLightbox}
          currentUser={currentUser}
          activeAlbumRole={activeAlbumRole}
          socket={socket}
        />
      ) : null}

      {showShareModal ? (
        <ShareModal
          resourceType="image"
          resourceId={shareResourceId}
          onClose={() => {
            setShowShareModal(false);
            setShareResourceId(null);
          }}
        />
      ) : null}
    </section>
  );
};

export default Gallery;
