// src/components/SharedView.jsx - Share links management and shared-with-me albums
import React, { useEffect, useState, useCallback } from "react";
import {
  Copy,
  ExternalLink,
  Link2,
  Link2Off,
  Loader2,
  Share2,
  Users,
} from "lucide-react";
import {
  fetchUserShareLinks,
  revokeShareLink,
  fetchAlbums,
} from "../api/imageApi";
import SectionHeader from "./ui/SectionHeader";
import EmptyState from "./ui/EmptyState";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import ConfirmDialog from "./ui/ConfirmDialog";
import useToast from "../hooks/useToast";

const SharedView = ({ currentUser }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("outgoing");
  const [shareLinks, setShareLinks] = useState([]);
  const [sharedAlbums, setSharedAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);
  const [confirmRevoke, setConfirmRevoke] = useState(null);

  const loadOutgoing = useCallback(async () => {
    try {
      const data = await fetchUserShareLinks();
      setShareLinks(data || []);
    } catch (err) {
      console.error("Failed to load share links:", err);
    }
  }, []);

  const loadIncoming = useCallback(async () => {
    try {
      const data = await fetchAlbums("shared");
      setSharedAlbums(data || []);
    } catch (err) {
      console.error("Failed to load shared albums:", err);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadOutgoing(), loadIncoming()]);
      setLoading(false);
    };
    load();
  }, [loadOutgoing, loadIncoming]);

  const handleRevoke = async (token) => {
    setRevoking(token);
    try {
      await revokeShareLink(token);
      setShareLinks((prev) =>
        prev.map((link) =>
          link.token === token
            ? { ...link, revokedAt: new Date().toISOString() }
            : link
        )
      );
      toast.success("Share link revoked successfully.");
    } catch (err) {
      console.error("Failed to revoke:", err);
      toast.error("Failed to revoke share link.");
    } finally {
      setRevoking(null);
      setConfirmRevoke(null);
    }
  };

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const getStatus = (link) => {
    if (link.revokedAt) return "revoked";
    if (link.expiresAt && new Date(link.expiresAt) < new Date())
      return "expired";
    return "active";
  };

  const statusBadge = (status) => {
    switch (status) {
      case "active":
        return <Badge theme="success">Active</Badge>;
      case "expired":
        return <Badge theme="warning">Expired</Badge>;
      case "revoked":
        return <Badge theme="danger">Revoked</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <SectionHeader
          title="Shared"
          subtitle="Loading your shared content…"
          icon={Share2}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="skeleton h-36 rounded-[24px]"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Shared"
        subtitle="Manage your shared links and collaborations"
        icon={Share2}
      />

      <div className="flex flex-wrap gap-2">
        {[
          { id: "outgoing", label: "My Shares", count: shareLinks.length },
          {
            id: "incoming",
            label: "Shared with me",
            count: sharedAlbums.length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-3.5 py-2 text-sm font-medium transition-all ${activeTab === tab.id ? "bg-emerald-500 text-slate-950" : "border border-slate-800 bg-slate-900/70 text-slate-400 hover:text-white"}`}
          >
            {tab.label}
            {tab.count > 0 ? (
              <span className="ml-1.5 text-xs opacity-75">({tab.count})</span>
            ) : null}
          </button>
        ))}
      </div>

      {activeTab === "outgoing" ? (
        shareLinks.length === 0 ? (
          <EmptyState
            icon={Link2}
            title="No share links yet"
            description="When you share photos or albums, your links will appear here for easy management."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shareLinks.map((link) => {
              const status = getStatus(link);
              const frontendUrl =
                process.env.REACT_APP_FRONTEND_URL || window.location.origin;
              const url = `${frontendUrl}/share/${link.token}`;

              return (
                <div
                  key={link._id}
                  className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                        <Link2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold capitalize text-white">
                          {link.resourceType}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatDate(link.createdAt)}
                        </p>
                      </div>
                    </div>
                    {statusBadge(status)}
                  </div>

                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-2">
                    <p className="flex-1 truncate text-xs text-slate-400">
                      {url}
                    </p>
                    {status === "active" ? (
                      <button
                        onClick={() => handleCopy(url)}
                        className="flex-shrink-0 text-slate-400 transition-colors hover:text-white"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>

                  {link.expiresAt ? (
                    <p className="mt-2 text-xs text-slate-500">
                      {status === "expired"
                        ? "Expired"
                        : `Expires ${formatDate(link.expiresAt)}`}
                    </p>
                  ) : null}

                  {link.passwordHash ? (
                    <p className="mt-1 text-xs text-slate-500">
                      🔒 Password protected
                    </p>
                  ) : null}

                  {status === "active" ? (
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(url, "_blank")}
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Preview
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        className="flex-1"
                        onClick={() => setConfirmRevoke(link.token)}
                        disabled={revoking === link.token}
                      >
                        {revoking === link.token ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Link2Off className="h-3.5 w-3.5" />
                        )}
                        Revoke
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )
      ) : sharedAlbums.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No shared albums"
          description="Albums shared with you by collaborators will appear here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sharedAlbums.map((album) => {
            const collabRecord = album.collaborators?.find(
              (c) => (c.user?._id || c.user) === currentUser?.id
            );
            const role = collabRecord?.role || "viewer";

            return (
              <div
                key={album._id}
                className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {album.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {album.description || "No description"}
                    </p>
                  </div>
                  <Badge
                    theme={role === "contributor" ? "accent" : "neutral"}
                  >
                    {role}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {album.imageCount}{" "}
                    {album.imageCount === 1 ? "photo" : "photos"}
                  </span>
                  <span>{formatDate(album.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirmRevoke !== null}
        title="Revoke share link?"
        message="This will immediately disable the link. Anyone with the link will no longer have access."
        confirmLabel="Revoke link"
        danger
        loading={revoking !== null}
        onConfirm={() => handleRevoke(confirmRevoke)}
        onCancel={() => setConfirmRevoke(null)}
      />
    </div>
  );
};

export default SharedView;
