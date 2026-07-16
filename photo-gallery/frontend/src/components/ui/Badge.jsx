import React from "react";

const themes = {
  neutral: "bg-slate-800 text-slate-300 border-slate-700",
  accent: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  danger: "bg-rose-500/10 text-rose-300 border-rose-500/20",
};

export default function Badge({ children, theme = "neutral", className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${themes[theme] || themes.neutral} ${className}`}
    >
      {children}
    </span>
  );
}
