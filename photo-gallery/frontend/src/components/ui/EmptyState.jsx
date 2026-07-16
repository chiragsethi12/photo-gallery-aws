import React from "react";
import { Sparkles } from "lucide-react";

export default function EmptyState({
  title,
  description,
  icon: Icon = Sparkles,
  action,
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-10 text-center shadow-[0_20px_60px_-30px_rgba(2,6,23,0.9)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-800/70 text-slate-300">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="mt-6 text-lg font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        {description}
      </p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
