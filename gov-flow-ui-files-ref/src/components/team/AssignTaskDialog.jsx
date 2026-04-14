import React, { useState } from "react";
import { listTasks, updateTask } from "@/api/tasksApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus, Search, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function AssignTaskDialog({ targetUser }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['unassignedTasks'],
    queryFn: () => listTasks(),
    enabled: open,
  });

  const assignTaskMutation = useMutation({
    mutationFn: ({ taskId, userId, userName }) =>
      updateTask(taskId, {
        lead_user_id: userId,
        lead_user_name: userName,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['unassignedTasks'] });
      toast.success(`Task assigned to ${targetUser.full_name}`);
      setOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to assign task: ${error.message}`);
    },
  });

  const filteredTasks = tasks.filter(task => {
    if (!searchQuery) return true;
    return task.pillar?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAssign = (task) => {
    assignTaskMutation.mutate({
      taskId: task.id,
      userId: targetUser.id,
      userName: targetUser.full_name,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      case 'not_started': return 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300';
      case 'on_hold': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      case 'delayed': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
          <UserPlus className="w-4 h-4 mr-1" />
          Assign Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl dark:bg-slate-800 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Assign Task to {targetUser.full_name}</DialogTitle>
          <DialogDescription className="dark:text-slate-400">
            Select a task to assign to this team member
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative isolate">
            <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>

          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No tasks found
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map(task => (
                  <div
                    key={task.id}
                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                          {task.pillar}
                        </h4>
                        {task.brief_description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                            {task.brief_description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={getStatusColor(task.status)} variant="secondary">
                            {task.status?.replace(/_/g, ' ')}
                          </Badge>
                          {task.priority && (
                            <Badge variant="outline" className="dark:border-slate-600 dark:text-slate-300">
                              {task.priority}
                            </Badge>
                          )}
                          {task.due_date && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                          {task.lead_user_name && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              Current: {task.lead_user_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAssign(task)}
                        disabled={assignTaskMutation.isPending}
                      >
                        {assignTaskMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Assign
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}