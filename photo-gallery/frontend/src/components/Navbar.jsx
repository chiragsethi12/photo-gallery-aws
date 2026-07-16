// src/components/Navbar.jsx - Premium top navigation for CloudSnap
import React, { useState } from "react";
import {
  Bell,
  ChevronDown,
  Image,
  LayoutGrid,
  LogOut,
  RefreshCcw,
  Search,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import Button from "./ui/Button";

const Navbar = ({
  onRefresh,
  imageCount,
  user,
  onLogout,
  viewMode = "photos",
  onViewModeChange,
  searchQuery = "",
  onSearchChange,
  onOpenUpload,
}) => {
  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      onSearchChange(e.target.value);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center gap-3">
          <button
            onClick={() => onViewModeChange("photos")}
            className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2.5 transition-all duration-200 hover:border-emerald-400/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Image className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">CloudSnap</p>
              <p className="text-[11px] text-slate-400">Studio workspace</p>
            </div>
          </button>

          <div className="hidden items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-1 md:flex">
            <button
              onClick={() => onViewModeChange("photos")}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition-all ${viewMode === "photos" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"}`}
            >
              Photos
            </button>
            <button
              onClick={() => onViewModeChange("albums")}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition-all ${viewMode === "albums" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"}`}
            >
              Albums
            </button>
          </div>
        </div>

        <div className="hidden flex-1 items-center justify-center md:flex">
          <label className="flex w-full max-w-xl items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2.5 text-slate-400 transition-all duration-200 focus-within:border-emerald-400/60 focus-within:ring-2 focus-within:ring-emerald-400/20">
            <Search className="h-4 w-4" />
            <input
              type="text"
              placeholder="Search by title, tag, or album"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
            />
            {searchQuery ? (
              <button
                onClick={() => onSearchChange("")}
                className="text-slate-500 hover:text-slate-200"
              >
                ×
              </button>
            ) : null}
          </label>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenUpload}
            className="hidden sm:inline-flex"
          >
            <UploadCloud className="h-4 w-4" />
            Upload
          </Button>
          <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/70 text-slate-300 transition-all hover:border-emerald-400/40 hover:text-white">
            <Bell className="h-4 w-4" />
          </button>
          <button
            onClick={onRefresh}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/70 text-slate-300 transition-all hover:border-emerald-400/40 hover:text-white"
            title="Refresh"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
          {user ? (
            <NavbarUserDropdown
              user={user}
              onLogout={onLogout}
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
};

const NavbarUserDropdown = ({ user, onLogout, viewMode, onViewModeChange }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 px-2.5 py-2 text-left transition-all hover:border-emerald-400/40"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-300">
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-white">
            {user?.name || "You"}
          </p>
          <p className="text-[11px] text-slate-400">Workspace owner</p>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
        />
      </button>

      {dropdownOpen ? (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setDropdownOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-800 bg-slate-950/95 p-2 shadow-soft">
            <button
              onClick={() => {
                onViewModeChange("analytics");
                setDropdownOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm ${viewMode === "analytics" ? "bg-emerald-500/10 text-emerald-300" : "text-slate-300 hover:bg-slate-800"}`}
            >
              <Sparkles className="h-4 w-4" /> Analytics
            </button>
            <button
              onClick={() => {
                onViewModeChange("sessions");
                setDropdownOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm ${viewMode === "sessions" ? "bg-emerald-500/10 text-emerald-300" : "text-slate-300 hover:bg-slate-800"}`}
            >
              <LayoutGrid className="h-4 w-4" /> Sessions
            </button>
            <button
              onClick={() => {
                onViewModeChange("trash");
                setDropdownOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm ${viewMode === "trash" ? "bg-emerald-500/10 text-emerald-300" : "text-slate-300 hover:bg-slate-800"}`}
            >
              <Image className="h-4 w-4" /> Trash
            </button>
            <div className="my-1 h-px bg-slate-800" />
            <button
              onClick={() => {
                onLogout();
                setDropdownOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-300 hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Navbar;
