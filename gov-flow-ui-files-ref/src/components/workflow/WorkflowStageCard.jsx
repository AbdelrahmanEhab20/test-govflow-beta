import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, CheckCircle2, Clock } from 'lucide-react';

export default function WorkflowStageCard({ stage, onEdit, onDelete }) {
  const getColorBg = (color) => {
    const colors = {
      blue: 'bg-blue-100 dark:bg-blue-900/30',
      green: 'bg-green-100 dark:bg-green-900/30',
      yellow: 'bg-yellow-100 dark:bg-yellow-900/30',
      red: 'bg-red-100 dark:bg-red-900/30',
      purple: 'bg-purple-100 dark:bg-purple-900/30',
    };
    return colors[color] || colors.blue;
  };

  const getColorBorder = (color) => {
    const colors = {
      blue: 'border-blue-300 dark:border-blue-800',
      green: 'border-green-300 dark:border-green-800',
      yellow: 'border-yellow-300 dark:border-yellow-800',
      red: 'border-red-300 dark:border-red-800',
      purple: 'border-purple-300 dark:border-purple-800',
    };
    return colors[color] || colors.blue;
  };

  return (
    <Card className={`p-4 border-2 ${getColorBorder(stage.color)} dark:bg-slate-800`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-4 h-4 rounded-full ${getColorBg(stage.color)}`} />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {stage.name}
            </h3>
            {!stage.is_active && (
              <Badge variant="secondary" className="bg-slate-300 dark:bg-slate-600">
                Inactive
              </Badge>
            )}
          </div>

          {stage.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              {stage.description}
            </p>
          )}

          <div className="flex gap-2 flex-wrap">
            {stage.require_approval && (
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Requires Approval
              </Badge>
            )}
            {stage.initiative_type && (
              <Badge variant="outline" className="dark:border-slate-600">
                {stage.initiative_type}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}