// src/components/SettingsView.jsx - Full user settings page
import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  Key,
  Loader2,
  LogOut,
  Monitor,
  Save,
  Settings2,
  Shield,
  Trash2,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  fetchProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  fetchSessions,
  revokeSession,
} from "../api/imageApi";
import { AuthContext } from "../context/AuthContext";
import SectionHeader from "./ui/SectionHeader";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import ConfirmDialog from "./ui/ConfirmDialog";
import useToast from "../hooks/useToast";

const SettingsView = () => {
  const { user, logout } = useContext(AuthContext);
  const toast = useToast();

  // Profile state
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingSession, setRevokingSession] = useState(null);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const data = await fetchProfile();
      setProfileName(data.name || "");
      setProfileEmail(data.email || "");
    } catch (err) {
      // Fallback to context user
      setProfileName(user?.name || "");
      setProfileEmail(user?.email || "");
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const data = await fetchSessions();
      setSessions(data || []);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadSessions();
  }, [loadProfile, loadSessions]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.error("Name is required.");
      return;
    }
    setProfileSaving(true);
    try {
      await updateProfile({ name: profileName, email: profileEmail });
      toast.success("Profile updated successfully.");
      // Update localStorage
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      storedUser.name = profileName;
      storedUser.email = profileEmail;
      localStorage.setItem("user", JSON.stringify(storedUser));
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Failed to update profile."
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword({
        currentPassword,
        newPassword,
      });
      toast.success("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Failed to change password."
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleRevokeSession = async (id) => {
    setRevokingSession(id);
    try {
      await revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Session revoked.");
    } catch (err) {
      toast.error("Failed to revoke session.");
    } finally {
      setRevokingSession(null);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await deleteAccount();
      toast.success("Account deleted. Goodbye.");
      logout();
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Failed to delete account."
      );
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const parseBrowser = (ua) => {
    if (!ua) return "Unknown browser";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return ua.substring(0, 30) + "…";
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <SectionHeader
        title="Settings"
        subtitle="Manage your account, security, and preferences"
        icon={Settings2}
      />

      {/* ── Profile Section ─────────────────────────────────────────── */}
      <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Profile</h3>
            <p className="text-sm text-slate-400">
              Your public display information
            </p>
          </div>
        </div>

        {profileLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
          </div>
        ) : (
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl font-bold text-emerald-300">
                {profileName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  {profileName || "Your Name"}
                </p>
                <p className="text-xs text-slate-400">{profileEmail}</p>
              </div>
            </div>

            <div>
              <label
                htmlFor="settings-name"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Display name
              </label>
              <input
                id="settings-name"
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="input-shell"
                disabled={profileSaving}
              />
            </div>

            <div>
              <label
                htmlFor="settings-email"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Email address
              </label>
              <input
                id="settings-email"
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="input-shell"
                disabled={profileSaving}
              />
            </div>

            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={profileSaving}
              >
                {profileSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save changes
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* ── Security Section ────────────────────────────────────────── */}
      <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Change password</h3>
            <p className="text-sm text-slate-400">
              Update your password for enhanced security
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label
              htmlFor="current-password"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Current password
            </label>
            <div className="relative">
              <input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-shell pr-10"
                disabled={passwordSaving}
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
                tabIndex={-1}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="new-password"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              New password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-shell pr-10"
                placeholder="At least 6 characters"
                disabled={passwordSaving}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
                tabIndex={-1}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm-new-password"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Confirm new password
            </label>
            <input
              id="confirm-new-password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className={`input-shell ${confirmNewPassword.length > 0 && newPassword !== confirmNewPassword ? "border-rose-500/40" : ""}`}
              disabled={passwordSaving}
              required
            />
            {confirmNewPassword.length > 0 &&
            newPassword !== confirmNewPassword ? (
              <p className="mt-1.5 text-xs text-rose-400">
                Passwords do not match.
              </p>
            ) : null}
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={
                passwordSaving ||
                !currentPassword ||
                !newPassword ||
                newPassword !== confirmNewPassword
              }
            >
              {passwordSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              Update password
            </Button>
          </div>
        </form>
      </div>

      {/* ── Sessions Section ────────────────────────────────────────── */}
      <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-fuchsia-300">
            <Monitor className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Active sessions</h3>
            <p className="text-sm text-slate-400">
              Devices currently signed in to your account
            </p>
          </div>
        </div>

        {sessionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">
            No active sessions found.
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-3"
              >
                <div className="flex items-center gap-3">
                  <Monitor className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {parseBrowser(session.userAgent)}
                    </p>
                    <p className="text-xs text-slate-400">
                      Created {formatDate(session.createdAt)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevokeSession(session.id)}
                  disabled={revokingSession === session.id}
                >
                  {revokingSession === session.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LogOut className="h-3.5 w-3.5" />
                  )}
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Danger Zone ─────────────────────────────────────────────── */}
      <div className="rounded-[28px] border border-rose-500/20 bg-slate-900/70 p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Danger zone</h3>
            <p className="text-sm text-slate-400">
              Irreversible actions on your account
            </p>
          </div>
        </div>

        <p className="mb-4 text-sm text-slate-400">
          Permanently delete your account and all associated data including
          images, albums, and share links. This action cannot be undone.
        </p>

        <Button
          variant="danger"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 className="h-4 w-4" /> Delete my account
        </Button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete your account?"
        message="This will permanently delete your account, all photos, albums, share links, and activity history. This action is irreversible."
        confirmLabel="Delete permanently"
        danger
        loading={deleteLoading}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

export default SettingsView;
