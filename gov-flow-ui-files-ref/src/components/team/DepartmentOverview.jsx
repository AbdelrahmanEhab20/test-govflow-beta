import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import ProgressBar from "../shared/ProgressBar";

export default function DepartmentOverview({ department, users, tasks }) {
  const deptTasks = tasks.filter(t => 
    users.map(u => u.id).includes(t.lead_user_id)
  );

  const stats = {
    members: users.length,
    total: deptTasks.length,
    completed: deptTasks.filter(t => t.status === 'completed').length,
    inProgress: deptTasks.filter(t => t.status === 'in_progress').length,
    overdue: deptTasks.filter(t => 
      t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
    ).length,
    avgCompletion: deptTasks.length > 0
      ? Math.round(deptTasks.reduce((sum, t) => sum + (t.completion_percent || 0), 0) / deptTasks.length)
      : 0
  };

  const completionRate = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  return (
    <Card className="mb-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg text-slate-900 dark:text-white">{department}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">Members</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.members}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium">Tasks</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-medium">Done</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Active</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Overdue</span>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Complete</span>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{completionRate}%</p>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
            <span>Department Progress</span>
            <span>{stats.avgCompletion}%</span>
          </div>
          <ProgressBar value={stats.avgCompletion} showLabel={false} size="md" />
        </div>
      </CardContent>
    </Card>
  );
}