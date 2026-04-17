import React from "react";
import { Button } from "@/components/ui/button";

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  actionLabel,
  className = ""
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-slate-400 dark:text-slate-300" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 text-center">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-300 mt-1 text-center max-w-sm">{description}</p>
      )}
      {action && actionLabel && (
        <Button onClick={action} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}