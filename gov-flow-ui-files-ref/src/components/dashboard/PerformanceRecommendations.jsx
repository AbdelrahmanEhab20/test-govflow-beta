import React from "react";
import { Zap, Target, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PerformanceRecommendations({ recommendations = [] }) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const getImpactIcon = (impact) => {
    switch (impact) {
      case 'high':
        return <Zap className="w-4 h-4" />;
      case 'medium':
        return <Target className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getImpactStyles = (impact) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  return (
    <div className="space-y-3">
      {recommendations.map((rec, idx) => (
        <Card key={idx} className="p-4 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                {rec.title}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {rec.description}
              </p>
              {rec.department && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Department: <span className="font-medium">{rec.department}</span>
                </p>
              )}
            </div>
            <Badge className={`flex items-center gap-1 flex-shrink-0 ${getImpactStyles(rec.impact)}`}>
              {getImpactIcon(rec.impact)}
              <span className="capitalize text-xs">{rec.impact}</span>
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}