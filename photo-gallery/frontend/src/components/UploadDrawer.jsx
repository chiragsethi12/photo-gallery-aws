import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Upload as UploadIcon, X } from "lucide-react";
import Upload from "./Upload";
import Button from "./ui/Button";

export default function UploadDrawer({
  open,
  onClose,
  onUploadSuccess,
  albums = [],
  activeAlbum = "",
}) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 24, stiffness: 220 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-slate-800 bg-slate-950/95 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
                  Upload
                </p>
                <h2 className="mt-1 text-xl font-semibold text-white">
                  Add photos to PixHive
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-10 w-10 rounded-full p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <UploadIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Streamlined uploads
                  </p>
                  <p className="text-sm text-slate-400">
                    Drag files in, preview them, then publish to your selected
                    album.
                  </p>
                </div>
              </div>
              <Upload
                onUploadSuccess={onUploadSuccess}
                albums={albums}
                activeAlbum={activeAlbum}
                onViewImage={null}
              />
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
