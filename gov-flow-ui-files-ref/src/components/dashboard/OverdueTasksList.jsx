import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Clock, User } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import PriorityBadge from "../shared/PriorityBadge";

export default function OverdueTasksList({ tasks = [], users = [] }) {
  const overdueTasks = tasks.filter(task => {
    if (!task.due_date || task.status === 'completed') return false;
    return new Date(task.due_date) < new Date();
  }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.full_name || "Unassigned";
  };

  return (
    <Card className="dark:border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
          <AlertCircle className="w-5 h-5 text-red-500" />
          Overdue Tasks
        </CardTitle>
        <span className="text-sm text-slate-500 dark:text-slate-400">{overdueTasks.length} tasks</span>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          {overdueTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">No overdue tasks</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overdueTasks.slice(0, 10).map((task) => {
                const daysOverdue = differenceInDays(new Date(), new Date(task.due_date));
                return (
                  <Link
                     key={task.id}
                     to={createPageUrl(`TaskDetail?id=${task.id}`)}
                     className="block p-3 rounded-lg border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                   >
                     <div className="flex items-start justify-between gap-3">
                       <div className="flex-1 min-w-0">
                         <p className="font-medium text-slate-900 dark:text-white truncate">{task.pillar}</p>
                         <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                           <span className="flex items-center gap-1">
                             <User className="w-3 h-3" />
                             {getUserName(task.lead_user_id)}
                           </span>
                           <span className="text-red-600 dark:text-red-400 font-medium">
                             {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                           </span>
                         </div>
                       </div>
                       <PriorityBadge priority={task.priority} size="sm" showIcon={false} />
                     </div>
                   </Link>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}