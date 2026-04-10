import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ListTodo,
  AlertCircle,
  Clock,
  CheckCircle2,
  Pause,
  User
} from "lucide-react";

export default function TaskViewTabs({
  activeView,
  onViewChange,
  tasks = [],
  currentUserId
}) {
  const myTasks = tasks.filter((t) => t.lead_user_id === currentUserId);
  const overdue = tasks.filter((t) =>
  t.due_date &&
  new Date(t.due_date) < new Date() &&
  t.status !== 'completed'
  );
  const dueThisWeek = tasks.filter((t) => {
    if (!t.due_date || t.status === 'completed') return false;
    const due = new Date(t.due_date);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return due >= now && due <= weekFromNow;
  });
  const inProgress = tasks.filter((t) => t.status === 'in_progress');
  const completed = tasks.filter((t) => t.status === 'completed');
  const blocked = tasks.filter((t) => t.status === 'on_hold' || t.status === 'delayed');

  const views = [
  { id: 'all', label: 'All Tasks', icon: ListTodo, count: tasks.length },
  { id: 'my', label: 'My Tasks', icon: User, count: myTasks.length },
  { id: 'overdue', label: 'Overdue', icon: AlertCircle, count: overdue.length, highlight: overdue.length > 0 },
  { id: 'due_week', label: 'Due This Week', icon: Clock, count: dueThisWeek.length },
  { id: 'in_progress', label: 'In Progress', icon: Clock, count: inProgress.length },
  { id: 'completed', label: 'Completed', icon: CheckCircle2, count: completed.length },
  { id: 'blocked', label: 'Blocked/Hold', icon: Pause, count: blocked.length }];


  return (
    <div className="overflow-x-auto pb-2 -mx-1 px-1">
      <Tabs value={activeView} onValueChange={onViewChange}>
        <TabsList className="bg-white dark:bg-slate-800 p-1 h-auto flex-nowrap gap-1 w-max min-w-full">
          {views.map((view) => {
            const Icon = view.icon;
            return (
              <TabsTrigger
                key={view.id}
                value={view.id}
                className="gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white text-slate-600 dark:text-slate-400"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline whitespace-nowrap">{view.label}</span>
                <Badge
                  variant={view.highlight ? "destructive" : "secondary"}
                  className="ml-1 px-1.5 py-0 text-xs"
                >
                  {view.count}
                </Badge>
              </TabsTrigger>
            );

          })}
          </TabsList>
          </Tabs>
          </div>
          );
          }