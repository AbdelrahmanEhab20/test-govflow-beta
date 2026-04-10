import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { format, startOfWeek, eachDayOfInterval, endOfWeek } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PriorityBadge from "../shared/PriorityBadge";

const PRIORITY_COLORS = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-slate-400"
};

export default function CalendarWeekView({ currentDate, tasksByDate, onDateSelect, onCreateTask }) {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDate[dateKey] || [];

          return (
            <Card key={dateKey} className="p-3 min-h-[180px] flex flex-col dark:bg-slate-800 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {format(day, 'EEE')}
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    {format(day, 'd')}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-1 overflow-y-auto min-h-0">
                {dayTasks.map((task) => (
                  <Link
                    key={task.id}
                    to={createPageUrl(`TaskDetail?id=${task.id}`)}
                    className={`
                      block px-2 py-1 rounded text-xs truncate
                      ${task.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700 line-through'
                        : `${PRIORITY_COLORS[task.priority]} text-white`
                      }
                    `}
                  >
                    {task.pillar}
                  </Link>
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCreateTask(day)}
                className="mt-2 text-xs h-8 w-full"
              >
                + Add Task
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}