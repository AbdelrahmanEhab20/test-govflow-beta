import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, AlertCircle } from 'lucide-react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';

export default function KanbanTaskCard({ task, getUserName, isDragging, isDraggable, currentUser }) {
  const navigate = useNavigate();

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      not_started: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      on_hold: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      delayed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return colors[status] || colors.not_started;
  };

  const getDueDate = () => {
    if (!task.due_date) return null;
    const dueDate = new Date(task.due_date);
    if (isToday(dueDate)) return 'Today';
    if (isTomorrow(dueDate)) return 'Tomorrow';
    if (isPast(dueDate)) return 'Overdue';
    return format(dueDate, 'MMM d');
  };

  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'completed';
  const isUrgent = task.priority === 'urgent' || task.priority === 'high';

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card
      className={`p-3 transition-all dark:bg-slate-800 dark:border-slate-700 border-l-4 ${
        isOverdue ? 'border-l-red-500' : 'border-l-slate-300'
      } ${
        isDraggable 
          ? 'cursor-grab hover:shadow-md' 
          : 'cursor-not-allowed'
      } ${
        isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''
      }`}
      onClick={() => navigate(createPageUrl(`TaskDetail?id=${task.id}`))}
    >
      {/* Title */}
      <div className="mb-2">
        <p className="font-medium text-sm text-slate-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400">
          {task.pillar}
        </p>
      </div>

      {/* Status and Alerts */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {task.status && (
          <Badge className={`text-xs ${getStatusColor(task.status)}`}>
            {task.status.replace('_', ' ')}
          </Badge>
        )}
        {isOverdue && (
          <Badge className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Overdue
          </Badge>
        )}
      </div>

      {/* Completion Progress */}
      {task.completion_percent > 0 && task.status !== 'completed' && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-600 dark:text-slate-400">Progress</span>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {task.completion_percent}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${task.completion_percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Priority and Due Date */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </Badge>
        {task.due_date && (
          <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>
            <Calendar className="w-3 h-3" />
            {getDueDate()}
          </div>
        )}
      </div>

      {/* Assignee and Drag Indicator */}
      <div className="flex items-center justify-between">
        {task.lead_user_id && (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs bg-blue-500 text-white">
                {getInitials(task.lead_user_name)}
              </AvatarFallback>
            </Avatar>
            <span
              className="text-xs text-slate-600 dark:text-slate-400 truncate block max-w-[120px]"
              title={task.lead_user_name || ''}
            >
              {task.lead_user_name}
            </span>
          </div>
        )}
        {isDraggable && (
          <span className="text-xs text-slate-400 dark:text-slate-500">⋮⋮</span>
        )}
      </div>
    </Card>
  );
}