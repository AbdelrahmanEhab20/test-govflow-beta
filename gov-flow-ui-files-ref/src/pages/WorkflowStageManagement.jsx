import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listWorkflowStages, createWorkflowStage, updateWorkflowStage, deleteWorkflowStage } from '@/api/workflowApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit2, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import WorkflowStageForm from '../components/workflow/WorkflowStageForm';
import WorkflowStageCard from '../components/workflow/WorkflowStageCard';

export default function WorkflowStageManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const queryClient = useQueryClient();

  const { data: stages = [], isLoading } = useQuery({
    queryKey: ['workflowStages'],
    queryFn: () => listWorkflowStages({}, '-order'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => createWorkflowStage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowStages'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ stageId, data }) => updateWorkflowStage(stageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowStages'] });
      setEditingStage(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (stageId) => deleteWorkflowStage(stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowStages'] });
      setDeleteConfirm(null);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ currentStage, targetStage }) => {
      await updateWorkflowStage(currentStage.id, { order: targetStage.order });
      await updateWorkflowStage(targetStage.id, { order: currentStage.order });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowStages'] });
    },
  });

  const handleMoveUp = (stage, index) => {
    if (index === 0) return;
    const prevStage = stages[index - 1];
    reorderMutation.mutate({ currentStage: stage, targetStage: prevStage });
  };

  const handleMoveDown = (stage, index) => {
    if (index === stages.length - 1) return;
    const nextStage = stages[index + 1];
    reorderMutation.mutate({ currentStage: stage, targetStage: nextStage });
  };

  const handleSubmit = (formData) => {
    if (editingStage) {
      updateMutation.mutate({ stageId: editingStage.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Workflow Stages</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Configure custom workflow stages for your Kanban board
        </p>
      </div>

      {/* Create Form */}
      {showForm || editingStage ? (
        <Card className="mb-8 dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <CardTitle>{editingStage ? 'Edit Workflow Stage' : 'Create New Workflow Stage'}</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkflowStageForm
              stage={editingStage}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingStage(null);
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowForm(true)} className="mb-8 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow Stage
        </Button>
      )}

      {/* Stages List */}
      {stages.length > 0 ? (
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.id} className="flex gap-4">
              <div className="flex flex-col gap-2 justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleMoveUp(stage, index)}
                  disabled={index === 0}
                  className="h-8 w-8"
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleMoveDown(stage, index)}
                  disabled={index === stages.length - 1}
                  className="h-8 w-8"
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1">
                <WorkflowStageCard
                  stage={stage}
                  onEdit={() => setEditingStage(stage)}
                  onDelete={() => setDeleteConfirm(stage)}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center dark:bg-slate-900 dark:border-slate-800">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            No workflow stages created yet. Create your first stage to get started.
          </p>
        </Card>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Workflow Stage</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}