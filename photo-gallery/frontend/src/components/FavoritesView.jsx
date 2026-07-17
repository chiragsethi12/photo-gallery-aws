// src/components/FavoritesView.jsx - Full favorites page with backend integration
import React, { useEffect, useState, useCallback } from "react";
import { Heart, Sparkles } from "lucide-react";
import { fetchImages, toggleFavoriteImage } from "../api/imageApi";
import ImageCard from "./ImageCard";
import Lightbox from "./Lightbox";
import SectionHeader from "./ui/SectionHeader";
import EmptyState from "./ui/EmptyState";
import useToast from "../hooks/useToast";

const FavoritesView = ({ currentUser, albums = [] }) => {
  const toast = useToast();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchImages({ favorites: true, limit: 100 });
      setImages(data.images || []);
    } catch (err) {
      console.error("Failed to load favorites:", err);
      toast.error("Failed to load favorites.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleToggleFavorite = async (imageId) => {
    // Optimistic remove from favorites view
    setImages((prev) => prev.filter((img) => img._id !== imageId));
    try {
      await toggleFavoriteImage(imageId);
      toast.info("Removed from favorites.");
    } catch (err) {
      console.error("Failed to unfavorite:", err);
      toast.error("Failed to update favorite status.");
      loadFavorites(); // Revert on failure
    }
  };

  const handleNavigateLightbox = (direction) => {
    if (direction === "next") {
      setSelectedIndex((prev) => (prev + 1) % images.length);
    } else {
      setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <SectionHeader
          title="Favorites"
          subtitle="Loading your favorite photos…"
          icon={Heart}
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="skeleton aspect-square rounded-[24px]"
              style={{ animationDelay: `${i * 70}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="space-y-4">
        <SectionHeader
          title="Favorites"
          subtitle="Your curated collection of best shots"
          icon={Heart}
        />
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Heart the images you love from the gallery and they'll appear here for quick access."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Favorites"
        subtitle={`${images.length} photo${images.length !== 1 ? "s" : ""} you've hearted`}
        icon={Heart}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {images.map((image, index) => (
          <ImageCard
            key={image.publicId}
            image={image}
            onDelete={() => {}}
            deleting={false}
            onClick={() => setSelectedIndex(index)}
            currentUser={currentUser}
            toggleFavorite={(imageId) => handleToggleFavorite(imageId)}
            onTagClick={() => {}}
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
        />
      ) : null}
    </div>
  );
};

export default FavoritesView;
