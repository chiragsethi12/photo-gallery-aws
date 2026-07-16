// src/App.jsx - Premium CloudSnap workspace shell
import React, { useContext, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  FolderKanban,
  Heart,
  LayoutGrid,
  Settings2,
  Sparkles,
  Users,
  Trash2,
} from "lucide-react";
import { io } from "socket.io-client";
import Navbar from "./components/Navbar";
import UploadDrawer from "./components/UploadDrawer";
import Gallery from "./components/Gallery";
import AlbumsView from "./components/AlbumsView";
import SessionsPanel from "./components/SessionsPanel";
import TrashView from "./components/TrashView";
import CollaboratorPanel from "./components/CollaboratorPanel";
import ActivityFeed from "./components/ActivityFeed";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import useGallery from "./hooks/useGallery";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { fetchAlbumById } from "./api/imageApi";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import PublicShareView from "./components/PublicShareView";
import Badge from "./components/ui/Badge";

const getSharedTokenFromUrl = () => {
  const match = window.location.pathname.match(/\/share\/([a-f0-9]+)/i);
  return match ? match[1] : null;
};

function MainApp() {
  const { user, token, logout } = useContext(AuthContext);
  const [isLoginView, setIsLoginView] = useState(true);
  const [viewMode, setViewMode] = useState("photos");
  const [activeAlbumDetails, setActiveAlbumDetails] = useState(null);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const {
    images,
    loading,
    error,
    deleting,
    totalPages,
    currentPage,
    totalImages,
    selectedAlbum,
    selectedTag,
    searchQuery,
    albums,
    albumsLoading,
    albumScope,
    trashImages,
    trashAlbums,
    trashLoading,
    loadImages,
    loadAlbums,
    filterByAlbum,
    filterByTag,
    handleSearch,
    deleteImage,
    loadTrash,
    restoreImage,
    restoreAlbum,
    permanentlyDeleteImage,
    permanentlyDeleteAlbum,
    toggleFavorite,
    addImage,
    removeImage,
    dateFrom,
    dateTo,
    sort,
    filterByDateRange,
    changeSort,
  } = useGallery();

  useEffect(() => {
    if (user) {
      loadAlbums();
    }
  }, [user, loadAlbums]);

  const handleSelectAlbum = async (albumId) => {
    filterByAlbum(albumId);
    setViewMode("photos");
    setShowCollaborators(false);
    setShowActivity(false);
    try {
      const details = await fetchAlbumById(albumId);
      setActiveAlbumDetails(details);
    } catch (err) {
      console.error("Failed to load album details:", err);
      setActiveAlbumDetails(null);
    }
  };

  const handleClearAlbum = () => {
    filterByAlbum("");
    setActiveAlbumDetails(null);
    setShowCollaborators(false);
    setShowActivity(false);
  };

  const refreshActiveAlbum = async () => {
    if (selectedAlbum) {
      try {
        const details = await fetchAlbumById(selectedAlbum);
        setActiveAlbumDetails(details);
      } catch (err) {
        console.error("Failed to refresh active album:", err);
      }
    }
  };

  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (selectedAlbum && token) {
      const socketUrl = process.env.REACT_APP_API_URL
        ? process.env.REACT_APP_API_URL.replace("/api", "")
        : window.location.origin;

      const newSocket = io(socketUrl, { auth: { token } });

      newSocket.on("connect", () => {
        newSocket.emit("join-album", { albumId: selectedAlbum });
      });

      newSocket.on("image:uploaded", (newImage) => {
        addImage(newImage);
      });

      newSocket.on("image:deleted", (deletedImageId) => {
        removeImage(deletedImageId);
      });

      newSocket.on("collaborator:changed", () => {
        refreshActiveAlbum();
        loadAlbums();
      });

      setSocket(newSocket);

      return () => {
        newSocket.emit("leave-album", { albumId: selectedAlbum });
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [selectedAlbum, token, addImage, removeImage, loadAlbums]);

  const handleViewImage = (image) => {
    if (image.album) {
      handleSelectAlbum(image.album);
    } else {
      handleClearAlbum();
    }
    filterByTag("");
    handleSearch(image.title || image.publicId.split("/").pop());
  };

  const sharedToken = getSharedTokenFromUrl();

  if (sharedToken) {
    return <PublicShareView token={sharedToken} />;
  }

  if (!user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4">
        <div className="pointer-events-none absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        {isLoginView ? (
          <LoginForm onToggleForm={() => setIsLoginView(false)} />
        ) : (
          <RegisterForm onToggleForm={() => setIsLoginView(true)} />
        )}
      </div>
    );
  }

  const navItems = [
    { id: "photos", label: "Photos", icon: LayoutGrid },
    { id: "albums", label: "Albums", icon: FolderKanban },
    { id: "favorites", label: "Favorites", icon: Heart },
    { id: "shared", label: "Shared", icon: Users },
    { id: "trash", label: "Trash", icon: Trash2 },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings2 },
  ];

  const subtitleMap = {
    photos: "Curate your latest uploads and keep every frame in order.",
    albums:
      "Organize images into polished collections with shared collaboration.",
    analytics: "Review activity and understand how your library is growing.",
    trash: "Restore or permanently clear items you no longer need.",
    sessions: "Monitor your active workspace sessions and collaborators.",
  };

  const pageTitle =
    viewMode === "albums"
      ? "Albums"
      : viewMode === "analytics"
        ? "Analytics"
        : viewMode === "trash"
          ? "Trash"
          : viewMode === "sessions"
            ? "Sessions"
            : "Photos";
  const pageSubtitle =
    subtitleMap[viewMode] ||
    "A calm, focused workspace designed for everyday photo management.";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar
        onRefresh={() => {
          if (viewMode === "photos") {
            loadImages(1);
          } else {
            loadAlbums();
          }
        }}
        imageCount={totalImages}
        user={user}
        onLogout={logout}
        viewMode={viewMode}
        onViewModeChange={(next) => {
          if (
            next === "favorites" ||
            next === "shared" ||
            next === "settings"
          ) {
            setViewMode("photos");
            return;
          }
          setViewMode(next);
        }}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        onOpenUpload={() => setUploadOpen(true)}
      />

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-72 flex-col rounded-[28px] border border-slate-800 bg-slate-900/70 p-4 lg:flex">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
                  Workspace
                </p>
                <h2 className="mt-1 text-base font-semibold text-white">
                  CloudSnap Library
                </h2>
              </div>
              <Badge theme="accent">Live</Badge>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Storage</span>
                <span className="font-semibold text-white">
                  {totalImages} files
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-800">
                <div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Your workspace is organized and ready for the next upload.
              </p>
            </div>
          </div>

          <nav className="mt-5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                viewMode === item.id ||
                (item.id === "photos" && viewMode === "favorites");
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (
                      item.id === "favorites" ||
                      item.id === "shared" ||
                      item.id === "settings"
                    ) {
                      setViewMode("photos");
                      return;
                    }
                    setViewMode(item.id);
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition-all ${active ? "bg-emerald-500/10 text-emerald-300" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="font-medium">Clean by design</span>
            </div>
            <p className="mt-2 leading-6">
              This workspace keeps your photo library focused, calm, and fast.
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-wrap items-end justify-between gap-4 rounded-[28px] border border-slate-800 bg-slate-900/70 p-5"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
                {pageTitle}
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-white">
                {pageTitle === "Photos" ? "Your photo workspace" : pageTitle}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                {pageSubtitle}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-400">
              <div className="flex items-center gap-2 text-slate-200">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span className="font-medium">
                  Professional, minimal, thoughtful
                </span>
              </div>
            </div>
          </motion.div>

          {viewMode === "albums" ? (
            <AlbumsView
              albums={albums}
              loading={albumsLoading}
              albumScope={albumScope}
              onSelectAlbum={handleSelectAlbum}
              onRefreshAlbums={loadAlbums}
              currentUser={user}
            />
          ) : viewMode === "sessions" ? (
            <SessionsPanel />
          ) : viewMode === "trash" ? (
            <TrashView
              trashImages={trashImages}
              trashAlbums={trashAlbums}
              loading={trashLoading}
              loadTrash={loadTrash}
              restoreImage={restoreImage}
              restoreAlbum={restoreAlbum}
              permanentlyDeleteImage={permanentlyDeleteImage}
              permanentlyDeleteAlbum={permanentlyDeleteAlbum}
            />
          ) : viewMode === "analytics" ? (
            <AnalyticsDashboard />
          ) : (
            <div className="space-y-6">
              {activeAlbumDetails ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-4 rounded-[28px] border border-slate-800 bg-slate-900/70 p-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm font-medium text-slate-400">
                        Viewing album
                      </p>
                      <h2 className="text-lg font-semibold text-white">
                        {activeAlbumDetails.name}
                      </h2>
                      <Badge
                        theme={
                          activeAlbumDetails.role === "owner"
                            ? "success"
                            : activeAlbumDetails.role === "contributor"
                              ? "accent"
                              : "neutral"
                        }
                      >
                        {activeAlbumDetails.role}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      Share, manage access, and keep this collection organized.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setShowActivity(!showActivity);
                        setShowCollaborators(false);
                      }}
                      className="rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-300 transition-all hover:border-emerald-400/40 hover:text-white"
                    >
                      {showActivity ? "Hide activity" : "Activity feed"}
                    </button>
                    {activeAlbumDetails.role === "owner" ? (
                      <button
                        onClick={() => {
                          setShowCollaborators(!showCollaborators);
                          setShowActivity(false);
                        }}
                        className="rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-300 transition-all hover:border-emerald-400/40 hover:text-white"
                      >
                        {showCollaborators
                          ? "Hide collaborators"
                          : "Manage collaborators"}
                      </button>
                    ) : null}
                  </div>
                </motion.div>
              ) : null}

              {showCollaborators &&
              activeAlbumDetails &&
              activeAlbumDetails.role === "owner" ? (
                <CollaboratorPanel
                  albumId={selectedAlbum}
                  collaborators={activeAlbumDetails.collaborators || []}
                  onRefreshAlbum={refreshActiveAlbum}
                />
              ) : null}
              {showActivity && activeAlbumDetails ? (
                <ActivityFeed albumId={selectedAlbum} />
              ) : null}

              <Gallery
                images={images}
                totalPages={totalPages}
                currentPage={currentPage}
                totalImages={totalImages}
                loading={loading}
                error={error}
                deleting={deleting}
                onDelete={deleteImage}
                onRetry={() => loadImages(currentPage)}
                onPageChange={loadImages}
                currentUser={user}
                toggleFavorite={toggleFavorite}
                selectedAlbum={selectedAlbum}
                selectedTag={selectedTag}
                onClearAlbumFilter={handleClearAlbum}
                onClearTagFilter={() => filterByTag("")}
                onTagClick={filterByTag}
                albums={albums}
                activeAlbumRole={activeAlbumDetails?.role}
                socket={socket}
                dateFrom={dateFrom}
                dateTo={dateTo}
                sort={sort}
                onDateRangeChange={filterByDateRange}
                onSortChange={changeSort}
              />
            </div>
          )}
        </main>
      </div>

      <UploadDrawer
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadSuccess={(newImage) => {
          addImage(newImage);
          setUploadOpen(false);
        }}
        albums={albums}
        activeAlbum={selectedAlbum}
      />

      <footer className="border-t border-slate-800/80 px-4 py-6 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
        CloudSnap · Designed for calm collaboration and modern photo management.
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
