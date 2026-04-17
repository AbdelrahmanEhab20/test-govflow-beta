import React, { useState } from "react";
import { createSubtask, updateSubtask, deleteSubtask } from "@/api/tasksApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  GripVertical, 
  Trash2, 
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

const STATUS_ICONS = {
  not_started: Circle,
  in_progress: Clock,
  done: CheckCircle2,
  blocked: AlertCircle
};

const STATUS_COLORS = {
  not_started: "text-slate-400",
  in_progress: "text-blue-500",
  done: "text-emerald-500",
  blocked: "text-red-500"
};

export default function SubtaskList({ taskId, subtasks = [], users = [] }) {
  const [newSubtask, setNewSubtask] = useState('');
  const [expandedSubtasks, setExpandedSubtasks] = useState([]);
  const queryClient = useQueryClient();

  const createSubtaskMutation = useMutation({
    mutationFn: (data) => createSubtask(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] }),
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: ({ id, data }) => updateSubtask(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] }),
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: (id) => deleteSubtask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] }),
  });

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    createSubtaskMutation.mutate({
      task_id: taskId,
      title: newSubtask,
      status: 'not_started',
      order: subtasks.length
    });
    setNewSubtask('');
  };

  const handleStatusChange = (subtask, newStatus) => {
    updateSubtaskMutation.mutate({
      id: subtask.id,
      data: { status: newStatus }
    });
  };

  const handleToggleChecklist = (subtask, itemIndex) => {
    const newChecklist = [...(subtask.checklist_items || [])];
    newChecklist[itemIndex] = {
      ...newChecklist[itemIndex],
      completed: !newChecklist[itemIndex].completed
    };
    updateSubtaskMutation.mutate({
      id: subtask.id,
      data: { checklist_items: newChecklist }
    });
  };

  const toggleExpand = (subtaskId) => {
    setExpandedSubtasks(prev => 
      prev.includes(subtaskId)
        ? prev.filter(id => id !== subtaskId)
        : [...prev, subtaskId]
    );
  };

  const completedCount = subtasks.filter(s => s.status === 'done').length;
  const totalCount = subtasks.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Subtasks</h3>
          {totalCount > 0 && (
            <span className="text-sm text-slate-500">
              {completedCount} / {totalCount} completed
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      )}

      {/* Add new subtask */}
      <div className="flex gap-2">
        <Input
          value={newSubtask}
          onChange={(e) => setNewSubtask(e.target.value)}
          placeholder="Add a subtask..."
          onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
          className="flex-1"
        />
        <Button 
          onClick={handleAddSubtask} 
          disabled={!newSubtask.trim() || createSubtaskMutation.isPending}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Subtask list */}
      <div className="space-y-2">
        {subtasks.map((subtask) => {
          const StatusIcon = STATUS_ICONS[subtask.status] || Circle;
          const isExpanded = expandedSubtasks.includes(subtask.id);
          const hasChecklist = subtask.checklist_items?.length > 0;
          const ownerUser = users.find(u => u.id === subtask.owner_user_id);

          return (
            <div 
              key={subtask.id}
              className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
            >
              <div className="flex items-center gap-3 p-3">
                <button onClick={() => handleStatusChange(subtask, 
                  subtask.status === 'done' ? 'not_started' : 'done'
                )}>
                  <StatusIcon className={`w-5 h-5 ${STATUS_COLORS[subtask.status]}`} />
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${subtask.status === 'done' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                    {subtask.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {ownerUser && <span>{ownerUser.full_name}</span>}
                    {subtask.due_date && (
                      <span>Due {format(new Date(subtask.due_date), 'MMM d')}</span>
                    )}
                  </div>
                </div>

                <Select
                  value={subtask.status}
                  onValueChange={(value) => handleStatusChange(subtask, value)}
                >
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>

                {hasChecklist && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleExpand(subtask.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-red-600"
                  onClick={() => deleteSubtaskMutation.mutate(subtask.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Checklist items */}
              {isExpanded && hasChecklist && (
                <div className="px-3 pb-3 pt-0 border-t border-slate-100">
                  <div className="pl-8 space-y-2 mt-2">
                    {subtask.checklist_items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Checkbox
                          checked={item.completed}
                          onCheckedChange={() => handleToggleChecklist(subtask, idx)}
                        />
                  <span className={item.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {subtasks.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
            No subtasks yet. Add one above.
          </p>
        )}
      </div>
    </div>
  );
}