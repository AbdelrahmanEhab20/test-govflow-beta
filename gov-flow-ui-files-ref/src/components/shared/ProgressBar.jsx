import React from "react";
import { Progress } from "@/components/ui/progress";

export default function ProgressBar({ value = 0, showLabel = true, size = "default" }) {
  const getColor = (val) => {
    if (val >= 100) return "bg-emerald-500";
    if (val >= 75) return "bg-blue-500";
    if (val >= 50) return "bg-yellow-500";
    if (val >= 25) return "bg-orange-500";
    return "bg-slate-300";
  };

  const heightClass = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div className="flex items-center gap-2 w-full">
      <div className={`flex-1 bg-slate-100 rounded-full ${heightClass} overflow-hidden`}>
        <div 
          className={`${getColor(value)} ${heightClass} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-slate-600 w-10 text-right">
          {value}%
        </span>
      )}
    </div>
  );
}