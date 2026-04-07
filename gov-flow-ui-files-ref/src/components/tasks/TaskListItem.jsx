import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { useQuery } from "@tanstack/react-query";
import { listWorkflowStages } from "@/api/workflowApi";
import {
  Calendar,
  User,
  MoreHorizontal,
  Mail,
  ExternalLink,
  Pencil,
  Trash2,
  CheckCircle2,
  MoveRight
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import StatusBadge from "../shared/StatusBadge";
import PriorityBadge from "../shared/PriorityBadge";
import ProgressBar from "../shared/ProgressBar";
import UserAvatar from "../shared/UserAvatar";

const STATUS_OPTIONS = ['not_started', 'in_progress', 'completed', 'on_hold', 'delayed'];

export default function TaskListItem({
  task,
  users = [],
  onUpdate,
  onDelete,
  isSelected,
  onSelect
}) {
  const [isEditing, setIsEditing] = useState(null);

  const { data: workflowStages = [] } = useQuery({
    queryKey: ['workflowStages'],
    queryFn: () => listWorkflowStages({ is_active: true }, 'order'),
  });

  const leadUser = users.find((u) => u.id === task.lead_user_id);
  const isOverdue = task.due_date &&
  new Date(task.due_date) < new Date() &&
  task.status !== 'completed';

  const handleStatusChange = (newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === 'completed') {
      updates.completion_percent = 100;
    }
    onUpdate(task.id, updates);
    setIsEditing(null);
  };

  const handleCompletionChange = (value) => {
    const completion = parseInt(value);
    const updates = { completion_percent: completion };
    if (completion === 100) {
      updates.status = 'completed';
    } else if (task.status === 'completed') {
      updates.status = 'in_progress';
    }
    onUpdate(task.id, updates);
    setIsEditing(null);
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all group">
      {/* Checkbox */}
      <Checkbox
        checked={isSelected}
        onCheckedChange={onSelect}
        className="shrink-0"
      />


      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                to={createPageUrl(`TaskDetail?id=${task.id}`)}
                className="font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate"
              >
                {task.pillar}
              </Link>
              {task.source_email_id && (
                <Mail className="w-4 h-4 text-purple-500 shrink-0" />
              )}
            </div>

            {task.brief_description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {task.brief_description}
              </p>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
              {leadUser && (
                <div className="flex items-center gap-1.5">
                  <UserAvatar user={leadUser} size="xs" showTooltip={false} />
                  <span>{leadUser.full_name}</span>
                </div>
              )}

              {task.due_date && (
                <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
                  <Calendar className="w-3 h-3" />
                  {format(new Date(task.due_date), 'MMM d, yyyy')}
                </div>
              )}
            </div>
          </div>

          {/* Status & Priority */}
          <div className="flex items-center gap-2 shrink-0">
            {isEditing === 'status' ? (
              <Select
                value={task.status}
                onValueChange={handleStatusChange}
                onOpenChange={(open) => !open && setIsEditing(null)}
              >
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>
                      {s.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <button onClick={() => setIsEditing('status')}>
                <StatusBadge status={task.status} size="sm" />
              </button>
            )}

            <PriorityBadge priority={task.priority} size="sm" showIcon={false} />
          </div>
        </div>

        {/* Progress */}
        <div className="mt-3 max-w-xs">
          {isEditing === 'progress' ? (
            <Select
              value={String(task.completion_percent || 0)}
              onValueChange={handleCompletionChange}
              onOpenChange={(open) => !open && setIsEditing(null)}
            >
              <SelectTrigger className="w-24 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(v => (
                  <SelectItem key={v} value={String(v)}>{v}%</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <button
              onClick={() => setIsEditing('progress')}
              className="w-full"
            >
              <ProgressBar value={task.completion_percent || 0} size="sm" />
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to={createPageUrl(`TaskDetail?id=${task.id}`)}>
              <ExternalLink className="w-4 h-4 mr-2" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={createPageUrl(`TaskForm?id=${task.id}`)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit Task
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark Complete
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <MoveRight className="w-4 h-4 mr-2" />
              Move to
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {workflowStages.map(stage => (
                <DropdownMenuItem
                  key={stage.id}
                  onClick={() => onUpdate(task.id, { workflow_stage_id: stage.id })}
                  disabled={task.workflow_stage_id === stage.id}
                >
                  {stage.name}
                </DropdownMenuItem>
              ))}
              {workflowStages.length === 0 && (
                <DropdownMenuItem disabled>
                  No stages configured
                </DropdownMenuItem>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(task.id)}
            className="text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
      );
      }