import React from "react";

const MEDALS = {
  1: { emoji: "🥇", bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-300 dark:border-yellow-700", text: "text-yellow-700 dark:text-yellow-400" },
  2: { emoji: "🥈", bg: "bg-slate-100 dark:bg-slate-700/40", border: "border-slate-300 dark:border-slate-600", text: "text-slate-600 dark:text-slate-300" },
  3: { emoji: "🥉", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-300 dark:border-orange-700", text: "text-orange-700 dark:text-orange-400" },
};

export default function RankBadge({ rank, size = "md" }) {
  if (rank <= 3) {
    const m = MEDALS[rank];
    return (
      <span className={`inline-flex items-center justify-center rounded-full border font-bold ${m.bg} ${m.border} ${m.text} ${size === "lg" ? "w-10 h-10 text-lg" : "w-7 h-7 text-sm"}`}>
        {rank}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold ${size === "lg" ? "w-10 h-10 text-base" : "w-7 h-7 text-xs"}`}>
      {rank}
    </span>
  );
}