import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowUp, ArrowRight, ArrowDown } from "lucide-react";

const PRIORITY_CONFIG = {
  urgent: { 
    label: "Urgent",
    icon: AlertTriangle,
    className: "bg-red-100 text-red-700 border-red-200"
  },
  high: { 
    label: "High",
    icon: ArrowUp,
    className: "bg-orange-100 text-orange-700 border-orange-200"
  },
  medium: { 
    label: "Medium",
    icon: ArrowRight,
    className: "bg-yellow-100 text-yellow-700 border-yellow-200"
  },
  low: { 
    label: "Low",
    icon: ArrowDown,
    className: "bg-slate-100 text-slate-600 border-slate-200"
  }
};

export default function PriorityBadge({ priority, showIcon = true, size = "default" }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const Icon = config.icon;
  
  return (
    <Badge 
      variant="outline"
      className={`${config.className} ${size === "sm" ? "text-xs px-2 py-0.5" : ""}`}
    >
      {showIcon && <Icon className={`${size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} mr-1`} />}
      {config.label}
    </Badge>
  );
}