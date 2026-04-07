import React from "react";
import { AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function PerformanceAlerts({ alerts = [] }) {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="space-y-3">
      {alerts.map((alert, idx) => (
        <Card key={idx} className={`p-4 border ${getSeverityStyles(alert.severity)}`}>
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getSeverityIcon(alert.severity)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                {alert.title}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {alert.description}
              </p>
              {alert.action && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
                  Action: {alert.action}
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}