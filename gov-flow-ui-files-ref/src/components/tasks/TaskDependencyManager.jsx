import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listTasks, listTaskDependenciesByDependent, createTaskDependency, deleteTaskDependency } from '@/api/tasksApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Link2, Trash2, Plus, ChevronRight } from 'lucide-react';
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog';
import { createPageUrl } from '@/utils';

export default function TaskDependencyManager({ taskId }) {
  const queryClient = useQueryClient();
  const [showAddDependency, setShowAddDependency] = useState(false);
  const [selectedDepId, setSelectedDepId] = useState('');
  const [depType, setDepType] = useState('finish_to_start');
  const [dependencyToDelete, setDependencyToDelete] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => listTasks(),
  });

  const { data: taskDependencies = [] } = useQuery({
    queryKey: ['taskDependencies', taskId],
    queryFn: () => listTaskDependenciesByDependent(taskId),
  });

  const advancedDependencies = taskDependencies.filter(
    (dep) => dep.dependency_type !== 'related',
  );

  const linkedPrerequisiteIds = new Set(
    taskDependencies.map((dep) => dep.prerequisite_task_id),
  );

  const handleAddDependency = async () => {
    if (!selectedDepId) return;

    await createTaskDependency({
      dependent_task_id: taskId,
      prerequisite_task_id: selectedDepId,
      dependency_type: depType,
      is_active: true
    });
    queryClient.invalidateQueries({ queryKey: ['taskDependencies', taskId] });
    queryClient.invalidateQueries({ queryKey: ['relatedTasks', 'out', taskId] });
    setSelectedDepId('');
    setDepType('finish_to_start');
    setShowAddDependency(false);
  };

  const handleRemoveDependency = async (depId) => {
    setIsRemoving(true);
    try {
      await deleteTaskDependency(depId);
      queryClient.invalidateQueries({ queryKey: ['taskDependencies', taskId] });
    queryClient.invalidateQueries({ queryKey: ['relatedTasks', 'out', taskId] });
    } finally {
      setIsRemoving(false);
    }
  };

  const getDependencyLabel = (type) => {
    const labels = {
      'finish_to_start': 'Must finish before this starts',
      'finish_to_finish': 'Must finish with this',
      'start_to_start': 'Must start before this starts',
      'start_to_finish': 'Must start before this finishes'
    };
    return labels[type] || type;
  };

  const getPrerequisiteTitle = (prereqId) => {
    const task = allTasks.find(t => t.id === prereqId);
    return task?.pillar || 'Unknown Task';
  };

  return (
    <Card className="dark:bg-slate-900 dark:border-slate-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <CardTitle>Dependencies (advanced)</CardTitle>
        </div>
        <CardDescription>
          Blocking prerequisites — finish-to-start and other scheduling rules
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {advancedDependencies.length > 0 && (
          <div className="space-y-2">
            {advancedDependencies.map((dep) => (
              <div key={dep.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex-1 min-w-0">
                  <Link
                    to={createPageUrl(`TaskDetail?id=${dep.prerequisite_task_id}`)}
                    className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400 text-sm hover:underline"
                  >
                    <span className="truncate">{getPrerequisiteTitle(dep.prerequisite_task_id)}</span>
                    <ChevronRight className="w-4 h-4 shrink-0 opacity-60" />
                  </Link>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {getDependencyLabel(dep.dependency_type)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDependencyToDelete(dep)}
                  className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {showAddDependency ? (
          <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Select value={selectedDepId} onValueChange={setSelectedDepId}>
              <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600">
                <SelectValue placeholder="Select prerequisite task" />
              </SelectTrigger>
              <SelectContent>
                {allTasks
                  .filter((t) => t.id !== taskId && !linkedPrerequisiteIds.has(t.id))
                  .map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.pillar}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>

            <Select value={depType} onValueChange={setDepType}>
              <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="finish_to_start">Finish to Start</SelectItem>
                <SelectItem value="finish_to_finish">Finish to Finish</SelectItem>
                <SelectItem value="start_to_start">Start to Start</SelectItem>
                <SelectItem value="start_to_finish">Start to Finish</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddDependency}>
                Add
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddDependency(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddDependency(true)}
            className="w-full dark:border-slate-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Dependency
          </Button>
        )}
      </CardContent>

      <ConfirmDeleteDialog
        open={Boolean(dependencyToDelete)}
        onOpenChange={(open) => !open && setDependencyToDelete(null)}
        title="Remove dependency?"
        description={`Remove the dependency on "${getPrerequisiteTitle(dependencyToDelete?.prerequisite_task_id)}"? This cannot be undone.`}
        confirmLabel="Remove"
        onConfirm={async () => {
          if (dependencyToDelete?.id) {
            await handleRemoveDependency(dependencyToDelete.id);
          }
          setDependencyToDelete(null);
        }}
        isPending={isRemoving}
      />
    </Card>
  );
}