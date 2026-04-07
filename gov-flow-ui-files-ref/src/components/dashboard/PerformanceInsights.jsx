import React from "react";
import { Lightbulb, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function PerformanceInsights({ insights = [] }) {
  if (!insights || insights.length === 0) {
    return null;
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'success':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <TrendingDown className="w-5 h-5 text-amber-600" />;
      default:
        return <Lightbulb className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {insights.map((insight, idx) => (
        <Card key={idx} className={`p-4 border ${getSeverityStyles(insight.severity)}`}>
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              {getSeverityIcon(insight.severity)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                {insight.title}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {insight.description}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}