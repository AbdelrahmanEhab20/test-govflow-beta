import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, User } from "lucide-react";
import { format, isThisWeek, addDays, isWithinInterval } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import StatusBadge from "../shared/StatusBadge";
import ProgressBar from "../shared/ProgressBar";

export default function DueThisWeekList({ tasks = [], users = [] }) {
  const today = new Date();
  const nextWeek = addDays(today, 7);
  
  const dueThisWeek = tasks.filter(task => {
    if (!task.due_date || task.status === 'completed') return false;
    const dueDate = new Date(task.due_date);
    return dueDate >= today && dueDate <= nextWeek;
  }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.full_name || "Unassigned";
  };

  return (
    <Card className="dark:border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
          <Calendar className="w-5 h-5 text-blue-500" />
          Due This Week
        </CardTitle>
        <span className="text-sm text-slate-500 dark:text-slate-400">{dueThisWeek.length} tasks</span>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          {dueThisWeek.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">No tasks due this week</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dueThisWeek.map((task) => (
                <Link
                  key={task.id}
                  to={createPageUrl(`TaskDetail?id=${task.id}`)}
                  className="block p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">{task.pillar}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {getUserName(task.lead_user_id)}
                        </span>
                        <span>
                          Due {format(new Date(task.due_date), 'EEE, MMM d')}
                        </span>
                      </div>
                      <div className="mt-2 w-32">
                        <ProgressBar value={task.completion_percent || 0} size="sm" />
                      </div>
                    </div>
                    <StatusBadge status={task.status} size="sm" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}