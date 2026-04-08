import React, { useState } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar, AlertCircle, MoreHorizontal, Eye, Edit, CheckCircle, MoveRight, Trash2 } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { listWorkflowStages } from '@/api/workflowApi';
import { updateTask, deleteTask } from '@/api/tasksApi';
import { ROLES } from '@/components/shared/rbac';
import { toast } from 'react-hot-toast';

export default function TaskListForBacklog({ tasks, getUserName, canDragTask, currentUser }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deleteTaskId, setDeleteTaskId] = useState(null);

  const { data: workflowStages = [] } = useQuery({
    queryKey: ['workflowStages'],
    queryFn: () => listWorkflowStages({ is_active: true }, 'order'),
  });

  const updateTaskMutation = useMutation({
    mutationFn: (taskData) => {
      const { id, ...patch } = taskData;
      return updateTask(id, patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      queryClient.invalidateQueries({ queryKey: ['workflowStages'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setDeleteTaskId(null);
    },
  });

  const isAdmin = currentUser?.role === ROLES.ADMIN || currentUser?.role === ROLES.DEPARTMENT_ADMIN;
  const isHigherRole = [ROLES.ADMIN, ROLES.DEPARTMENT_ADMIN, ROLES.DEPARTMENT_MANAGER, ROLES.EDITOR].includes(currentUser?.role);
  const canProgressTask = (task) => isHigherRole || ((currentUser?.role === ROLES.TEAM_MEMBER || currentUser?.role === ROLES.USER) && task.lead_user_id === currentUser?.id);
  const canCompleteTask = isHigherRole;

  const handleViewDetails = (taskId) => {
    navigate(createPageUrl(`TaskDetail?id=${taskId}`));
  };

  const handleEditTask = (taskId) => {
    navigate(createPageUrl(`TaskForm?id=${taskId}`));
  };

  const handleMarkComplete = (task) => {
    if (!canCompleteTask) {
      toast.error('Only managers/admins can complete tasks.');
      return;
    }
    const completedStage =
      workflowStages.find((s) => s.name === 'Completed') ||
      workflowStages.find((s) => s.name === 'Done');

    updateTaskMutation.mutate({
      id: task.id,
      workflow_stage_id: completedStage?.id || task.workflow_stage_id,
      status: 'completed',
      completion_percent: 100,
    });
  };

  const handleMoveTo = (taskId, stageId) => {
    const stage = workflowStages.find((s) => s.id === stageId);
    const task = tasks.find((t) => t.id === taskId);

    const statusByStageName = {
      Planning: 'not_started',
      Pipeline: 'not_started',
      'In Progress': 'in_progress',
      'In Review': 'in_progress',
      Review: 'in_progress',
      Completed: 'completed',
      Approved: 'completed',
      'On Hold': 'on_hold',
    };

    let nextStatus = task?.status || 'not_started';
    if (stage?.name && statusByStageName[stage.name]) {
      nextStatus = statusByStageName[stage.name];
    }

    if (!canProgressTask(task)) {
      toast.error('You can only move your assigned tasks.');
      return;
    }
    if (!canCompleteTask && ['completed', 'approved'].includes(String(stage?.name || '').toLowerCase())) {
      toast.error('Only managers/admins can move tasks to completed.');
      return;
    }

    updateTaskMutation.mutate({
      id: taskId,
      workflow_stage_id: stageId,
      status: nextStatus,
      ...(nextStatus === 'completed' ? { completion_percent: 100 } : {}),
    });
  };

  const handleDelete = (taskId) => {
    deleteTaskMutation.mutate(taskId);
  };
  const sortTasksByPriorityAndDeadline = () => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    
    return [...tasks].sort((a, b) => {
      // First sort by priority
      const priorityDiff = (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then sort by due date (soonest first)
      if (a.due_date && b.due_date) {
        return new Date(a.due_date) - new Date(b.due_date);
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return colors[priority] || colors.medium;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isOverdue = (task) => task.due_date && isPast(new Date(task.due_date)) && task.status !== 'completed';

  const sortedTasks = sortTasksByPriorityAndDeadline();

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-300 dark:border-slate-700 shadow-lg">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          📋 Backlog
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''} • Drag to stages or use the + button
        </p>
      </div>
      
      <Droppable droppableId="backlog-task-list" type="TASK">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`max-h-96 overflow-y-auto transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
          >
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {sortedTasks.map((task, index) => {
            const isDraggable = canDragTask && canDragTask(task);
            
            return (
              <Draggable
                key={task.id}
                draggableId={`backlog-task-${task.id}`}
                index={index}
                isDragDisabled={!isDraggable}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`p-3 transition-colors ${
                      !isDraggable ? 'opacity-60 cursor-not-allowed' : 'cursor-grab hover:bg-slate-100 dark:hover:bg-slate-800'
                    } ${snapshot.isDragging ? 'bg-blue-100 dark:bg-blue-900/30 shadow-lg' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                          {task.pillar}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                          {isOverdue(task) && (
                            <Badge className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Overdue
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-right">
                        {task.due_date && (
                          <div className={`flex flex-col items-end gap-1 text-xs ${isOverdue(task) ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(task.due_date), 'MMM d')}
                            </div>
                          </div>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleViewDetails(task.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {isAdmin && (
                              <DropdownMenuItem onClick={() => handleEditTask(task.id)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Task
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleMarkComplete(task)} disabled={!canCompleteTask}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark Complete
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="bg-purple-600 text-white hover:bg-purple-700 data-[state=open]:bg-purple-700">
                                <MoveRight className="w-4 h-4 mr-2" />
                                Move to
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {workflowStages.map(stage => (
                                  <DropdownMenuItem
                                    key={stage.id}
                                    onClick={() => handleMoveTo(task.id, stage.id)}
                                    disabled={
                                      !canProgressTask(task) ||
                                      (!canCompleteTask && ['completed', 'approved'].includes(String(stage.name || '').toLowerCase()))
                                    }
                                  >
                                    {stage.name}
                                  </DropdownMenuItem>
                                ))}
                                {workflowStages.length === 0 && (
                                  <DropdownMenuItem disabled>
                                    No stages available
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600 dark:text-red-400"
                              onClick={() => setDeleteTaskId(task.id)}
                              disabled={!isHigherRole}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                )}
              </Draggable>
            );
              })}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>

      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(deleteTaskId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}