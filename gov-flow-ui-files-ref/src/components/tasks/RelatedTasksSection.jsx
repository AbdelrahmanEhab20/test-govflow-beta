import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  listTasks,
  listTaskDependenciesByDependent,
  listTaskDependencies,
  createTaskDependency,
  deleteTaskDependency,
} from "@/api/tasksApi";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link2, Trash2, Plus, ChevronRight } from "lucide-react";
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import { createPageUrl } from "@/utils";

function getTaskTitle(tasks, taskId) {
  const task = tasks.find((t) => t.id === taskId);
  return task?.pillar || "Unknown Task";
}

export default function RelatedTasksSection({ taskId }) {
  const queryClient = useQueryClient();
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [linkToDelete, setLinkToDelete] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const { data: allTasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => listTasks(),
  });

  const { data: outgoingRelated = [] } = useQuery({
    queryKey: ["relatedTasks", "out", taskId],
    queryFn: () => listTaskDependenciesByDependent(taskId),
    enabled: Boolean(taskId),
  });

  const { data: incomingRelated = [] } = useQuery({
    queryKey: ["relatedTasks", "in", taskId],
    queryFn: () => listTaskDependencies(taskId),
    enabled: Boolean(taskId),
  });

  const relatedOutgoing = useMemo(
    () => outgoingRelated.filter((dep) => dep.dependency_type === "related"),
    [outgoingRelated],
  );

  const relatedIncoming = useMemo(
    () => incomingRelated.filter((dep) => dep.dependency_type === "related"),
    [incomingRelated],
  );

  const linkedTaskIds = useMemo(() => {
    const ids = new Set([taskId]);
    relatedOutgoing.forEach((dep) => ids.add(dep.prerequisite_task_id));
    relatedIncoming.forEach((dep) => ids.add(dep.dependent_task_id));
    return ids;
  }, [taskId, relatedOutgoing, relatedIncoming]);

  const availableTasks = useMemo(
    () => allTasks.filter((t) => !linkedTaskIds.has(t.id)),
    [allTasks, linkedTaskIds],
  );

  const invalidateRelated = () => {
    queryClient.invalidateQueries({ queryKey: ["relatedTasks", "out", taskId] });
    queryClient.invalidateQueries({ queryKey: ["relatedTasks", "in", taskId] });
    queryClient.invalidateQueries({ queryKey: ["taskDependencies", taskId] });
  };

  const handleLinkTask = async () => {
    if (!selectedTaskId) return;
    setIsAdding(true);
    try {
      await createTaskDependency({
        dependent_task_id: taskId,
        prerequisite_task_id: selectedTaskId,
        dependency_type: "related",
        is_active: true,
      });
      setSelectedTaskId("");
      invalidateRelated();
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveLink = async (depId) => {
    setIsRemoving(true);
    try {
      await deleteTaskDependency(depId);
      invalidateRelated();
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a task to link..." />
          </SelectTrigger>
          <SelectContent>
            {availableTasks.length === 0 ? (
              <SelectItem value="__none__" disabled>
                No other tasks available
              </SelectItem>
            ) : (
              availableTasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.pillar}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button
          onClick={handleLinkTask}
          disabled={!selectedTaskId || isAdding}
          className="gap-1 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Link task
        </Button>
      </div>

      {relatedOutgoing.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Related to
          </p>
          <div className="space-y-2">
            {relatedOutgoing.map((dep) => (
              <div
                key={dep.id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <Link
                  to={createPageUrl(`TaskDetail?id=${dep.prerequisite_task_id}`)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Link2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {getTaskTitle(allTasks, dep.prerequisite_task_id)}
                  </span>
                  <ChevronRight className="w-4 h-4 shrink-0 opacity-60" />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                  onClick={() => setLinkToDelete(dep)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {relatedIncoming.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Linked from
          </p>
          <div className="space-y-2">
            {relatedIncoming.map((dep) => (
              <div
                key={dep.id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <Link
                  to={createPageUrl(`TaskDetail?id=${dep.dependent_task_id}`)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Link2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {getTaskTitle(allTasks, dep.dependent_task_id)}
                  </span>
                  <ChevronRight className="w-4 h-4 shrink-0 opacity-60" />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                  onClick={() => setLinkToDelete(dep)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {relatedOutgoing.length === 0 && relatedIncoming.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-2">
          No related tasks yet. Link an existing task above.
        </p>
      )}

      <ConfirmDeleteDialog
        open={Boolean(linkToDelete)}
        onOpenChange={(open) => !open && setLinkToDelete(null)}
        title="Remove related task link?"
        description="This removes the link between tasks. The tasks themselves are not deleted."
        confirmLabel="Remove link"
        onConfirm={async () => {
          if (linkToDelete?.id) {
            await handleRemoveLink(linkToDelete.id);
          }
          setLinkToDelete(null);
        }}
        isPending={isRemoving}
      />
    </div>
  );
}
