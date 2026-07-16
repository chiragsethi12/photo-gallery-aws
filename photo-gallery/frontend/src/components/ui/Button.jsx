import React from "react";

const variants = {
  primary:
    "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.45)]",
  secondary:
    "bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700",
  ghost: "bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white",
  danger:
    "bg-rose-500/15 text-rose-300 border border-rose-500/20 hover:bg-rose-500/25",
};

const sizes = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

export default function Button({
  children,
  className = "",
  variant = "secondary",
  size = "md",
  as: Component = "button",
  ...props
}) {
  const baseClass =
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 disabled:cursor-not-allowed disabled:opacity-60";
  const variantClass = variants[variant] || variants.secondary;
  const sizeClass = sizes[size] || sizes.md;

  return (
    <Component
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
