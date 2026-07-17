// src/components/ui/Toast.jsx - Premium animated toast notifications
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from "lucide-react";
import useToast from "../../hooks/useToast";

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  error:
    "border-rose-500/30 bg-rose-500/10 text-rose-200",
  warning:
    "border-amber-500/30 bg-amber-500/10 text-amber-200",
  info: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
};

const iconColorMap = {
  success: "text-emerald-400",
  error: "text-rose-400",
  warning: "text-amber-400",
  info: "text-cyan-400",
};

function ToastItem({ toast, onRemove }) {
  const Icon = iconMap[toast.type] || Info;
  const colorClass = colorMap[toast.type] || colorMap.info;
  const iconColor = iconColorMap[toast.type] || iconColorMap.info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)] backdrop-blur-xl ${colorClass}`}
    >
      <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${iconColor}`} />
      <p className="flex-1 text-sm font-medium leading-relaxed">
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col items-end gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
