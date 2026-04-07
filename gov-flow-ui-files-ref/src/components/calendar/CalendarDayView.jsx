import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PriorityBadge from "../shared/PriorityBadge";
import StatusBadge from "../shared/StatusBadge";

export default function CalendarDayView({ selectedDate, tasksByDate, users, onCreateTask }) {
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const dayTasks = tasksByDate[dateKey] || [];

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.full_name || 'Unassigned';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h2>
        <Button onClick={() => onCreateTask(selectedDate)} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Add Task
        </Button>
      </div>

      {dayTasks.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-500">No tasks scheduled for this day</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {dayTasks.map((task) => (
            <Link
              key={task.id}
              to={createPageUrl(`TaskDetail?id=${task.id}`)}
              className="block"
            >
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">
                      {task.pillar}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {task.brief_description}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <StatusBadge status={task.status} size="sm" />
                      <PriorityBadge priority={task.priority} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Lead: {getUserName(task.lead_user_id)}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}