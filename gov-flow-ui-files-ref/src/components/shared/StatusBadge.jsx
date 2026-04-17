import React from "react";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG = {
  not_started: { 
    en: "Not Started", 
    ar: "لم يبدأ",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-700/40 dark:text-slate-300 dark:hover:bg-slate-700/40"
  },
  in_progress: { 
    en: "In Progress", 
    ar: "قيد التنفيذ",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/30"
  },
  completed: { 
    en: "Completed", 
    ar: "مكتمل",
    className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
  },
  on_hold: { 
    en: "On Hold", 
    ar: "مؤجل",
    className: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/30"
  },
  delayed: { 
    en: "Delayed", 
    ar: "متأخر",
    className: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/30"
  },
  done: { 
    en: "Done", 
    ar: "منجز",
    className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
  },
  blocked: { 
    en: "Blocked", 
    ar: "محظور",
    className: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/30"
  },
  new: { 
    en: "New", 
    ar: "جديد",
    className: "bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/30"
  },
  triaged: { 
    en: "Triaged", 
    ar: "مصنف",
    className: "bg-sky-100 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-300 dark:hover:bg-sky-900/30"
  },
  converted: { 
    en: "Converted", 
    ar: "محول",
    className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
  },
  archived: { 
    en: "Archived", 
    ar: "مؤرشف",
    className: "bg-slate-100 text-slate-500 hover:bg-slate-100 dark:bg-slate-700/40 dark:text-slate-300 dark:hover:bg-slate-700/40"
  }
};

export default function StatusBadge({ status, showArabic = false, size = "default" }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  
  return (
    <Badge 
      variant="secondary"
      className={`${config.className} ${size === "sm" ? "text-xs px-2 py-0.5" : ""}`}
    >
      {showArabic ? `${config.ar} | ${config.en}` : config.en}
    </Badge>
  );
}