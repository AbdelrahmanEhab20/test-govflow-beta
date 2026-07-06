import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import {
  Plus,
  Download,
  Trash2,
  CheckCircle2,
  LayoutGrid,
  List,
  ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

import TaskFilters from "../components/tasks/TaskFilters";
import TaskListItem from "../components/tasks/TaskListItem";
import TaskViewTabs from "../components/tasks/TaskViewTabs";
import EmptyState from "../components/shared/EmptyState";
import { getCurrentUser } from "@/api/authApi";
import { listTasks, updateTask, deleteTask } from "@/api/tasksApi";
import { listUsers } from "@/api/usersApi";
import { ROLES } from "@/components/shared/rbac";
import { toast } from "react-hot-toast";

export default function Tasks() {
  const [activeView, setActiveView] = useState('all');
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    lead: 'all',
    pillar: 'all',
    emailSourced: false
  });
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => listTasks({ orderBy: '-created_date' }),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => updateTask(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    onError: (error) => {
      toast.error(error?.message || 'Unable to update task.');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSelectedTasks([]);
    },
  });

  // Get unique pillars
  const pillars = useMemo(() => {
    const uniquePillars = [...new Set(tasks.map(t => t.pillar).filter(Boolean))];
    return uniquePillars.sort();
  }, [tasks]);

  // Filter tasks based on view and filters
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Apply view filter
    switch (activeView) {
      case 'my':
        result = result.filter(t => t.lead_user_id === currentUser?.id);
        break;
      case 'overdue':
        result = result.filter(t => 
          t.due_date && 
          new Date(t.due_date) < new Date() && 
          t.status !== 'completed'
        );
        break;
      case 'due_week':
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        result = result.filter(t => {
          if (!t.due_date || t.status === 'completed') return false;
          const due = new Date(t.due_date);
          return due >= now && due <= weekFromNow;
        });
        break;
      case 'in_progress':
        result = result.filter(t => t.status === 'in_progress');
        break;
      case 'completed':
        result = result.filter(t => t.status === 'completed');
        break;
      case 'blocked':
        result = result.filter(t => t.status === 'on_hold' || t.status === 'delayed');
        break;
    }

    // Apply filters
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(t => 
        t.pillar?.toLowerCase().includes(search) ||
        t.brief_description?.toLowerCase().includes(search)
      );
    }

    if (filters.status !== 'all') {
      result = result.filter(t => t.status === filters.status);
    }

    if (filters.priority !== 'all') {
      result = result.filter(t => t.priority === filters.priority);
    }

    if (filters.lead !== 'all') {
      result = result.filter(t => t.lead_user_id === filters.lead);
    }

    if (filters.pillar !== 'all') {
      result = result.filter(t => t.pillar === filters.pillar);
    }

    if (filters.emailSourced) {
      result = result.filter(t => t.source_email_id);
    }

    return result;
  }, [tasks, activeView, filters, currentUser?.id]);

  const handleUpdateTask = (id, data) => {
    updateTaskMutation.mutate({ id, data });
  };

  const handleDeleteTask = (id) => {
    setTaskToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete);
    }
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  const handleBulkComplete = () => {
    const canComplete = [ROLES.ADMIN, ROLES.DEPARTMENT_ADMIN, ROLES.DEPARTMENT_MANAGER, ROLES.EDITOR].includes(currentUser?.role);
    if (!canComplete) {
      toast.error('Only managers/admins can complete tasks.');
      return;
    }
    selectedTasks.forEach(id => {
      updateTaskMutation.mutate({ 
        id, 
        data: { status: 'completed', completion_percent: 100 } 
      });
    });
    setSelectedTasks([]);
  };

  const handleBulkDelete = () => {
    selectedTasks.forEach(id => {
      deleteTaskMutation.mutate(id);
    });
    setSelectedTasks([]);
  };

  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleExport = () => {
    const csvContent = [
      ['Title', 'Status', 'Priority', 'Lead', 'Due Date', 'Completion %'].join(','),
      ...filteredTasks.map(t => [
        `"${t.pillar || ''}"`,
        t.status,
        t.priority,
        users.find(u => u.id === t.lead_user_id)?.full_name || '',
        t.due_date || '',
        t.completion_percent || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-3 sm:p-4 lg:p-8 space-y-5 sm:space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-950 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Tasks</h1>
          <p className="text-slate-500 dark:text-slate-300 mt-1">Manage department initiatives and tasks</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleExport} className="flex-1 sm:flex-none">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Link to={createPageUrl('TaskForm')} className="flex-1 sm:flex-none">
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </Link>
        </div>
      </div>

      {/* View Tabs */}
      <TaskViewTabs 
        activeView={activeView}
        onViewChange={setActiveView}
        tasks={tasks}
        currentUserId={currentUser?.id}
      />

      {/* Filters */}
      <TaskFilters 
        filters={filters}
        onFilterChange={setFilters}
        users={users}
        pillars={pillars}
      />

      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected
          </span>
          <div className="hidden sm:block flex-1" />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBulkComplete}
            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 w-full sm:w-auto"
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Mark Complete
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBulkDelete}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 w-full sm:w-auto"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      )}

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks found"
          description={activeView === 'all' && !filters.search 
            ? "Create your first task to get started"
            : "Try adjusting your filters or search term"
          }
          action={activeView === 'all' && !filters.search 
            ? () => navigate(createPageUrl('TaskForm'))
            : undefined
          }
          actionLabel="Create Task"
        />
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => (
            <TaskListItem
              key={task.id}
              task={task}
              users={users}
              currentUser={currentUser}
              onUpdate={handleUpdateTask}
              onDelete={handleDeleteTask}
              isSelected={selectedTasks.includes(task.id)}
              onSelect={() => toggleTaskSelection(task.id)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}