import React, { useState } from "react";
import {
  listRoutingRules,
  createRoutingRule,
  updateRoutingRule,
  deleteRoutingRule,
  reorderRoutingRules,
} from "@/api/routingRulesApi";
import { listUsers } from "@/api/usersApi";
import { getCurrentUser } from "@/api/authApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Route,
  Mail,
  User,
  Tag,
  Flag,
  Loader2,
  ArrowDown,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import EmptyState from "../components/shared/EmptyState";
import { useRbac } from "@/components/shared/useRbac";
import { PERMISSIONS } from "@/components/shared/rbac";

const CONDITION_TYPES = [
  { value: "subject_contains", label: "Subject contains", icon: Mail },
  { value: "from_contains", label: "From contains", icon: User },
  { value: "body_contains", label: "Body contains", icon: Mail },
  { value: "from_domain", label: "From domain", icon: Mail },
];

const ACTION_TYPES = [
  { value: "assign_to", label: "Assign to user", icon: User },
  { value: "set_category", label: "Set category", icon: Tag },
  { value: "add_tag", label: "Add tag", icon: Tag },
  { value: "set_priority", label: "Set priority", icon: Flag },
];

const CATEGORIES = [
  "general", "invitation", "mou", "media", "data_request", "complaint", "protocol", "other"
];

const PRIORITIES = ["low", "medium", "high", "urgent"];

function RuleCardContent({
  rule,
  index,
  canEdit,
  conditionType,
  actionType,
  ConditionIcon,
  ActionIcon,
  getActionValueDisplay,
  onToggleActive,
  onEdit,
  onDelete,
  dragHandleProps,
}) {
  return (
    <Card
      className={`dark:border-slate-700 ${!rule.is_active ? 'opacity-50' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
            <div {...dragHandleProps}>
              <GripVertical className={`w-5 h-5 ${canEdit ? 'cursor-grab active:cursor-grabbing' : 'opacity-40'}`} />
            </div>
            <span className="text-sm font-mono">#{index + 1}</span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-slate-900 dark:text-white">{rule.name}</span>
              {!rule.is_active && (
                <Badge variant="secondary">Disabled</Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                <ConditionIcon className="w-3 h-3" />
                <span>If {conditionType?.label.toLowerCase()}</span>
                <Badge variant="outline" className="ml-1">{rule.condition_value}</Badge>
              </div>
              <span>→</span>
              <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded text-blue-700 dark:text-blue-300">
                <ActionIcon className="w-3 h-3" />
                <span>{actionType?.label}:</span>
                <Badge variant="secondary" className="ml-1">
                  {getActionValueDisplay(rule)}
                </Badge>
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              <Switch
                checked={rule.is_active}
                onCheckedChange={() => onToggleActive(rule)}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(rule)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Rule</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this rule?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(rule.id)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function RoutingRules() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    condition_type: 'subject_contains',
    condition_value: '',
    action_type: 'set_category',
    action_value: '',
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const { hasPermission } = useRbac(currentUser?.role);
  const canEdit = hasPermission(currentUser?.role, PERMISSIONS.ROUTING_EDIT);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['routingRules'],
    queryFn: () => listRoutingRules('order'),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => createRoutingRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routingRules'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateRoutingRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routingRules'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteRoutingRule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routingRules'] }),
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds) => reorderRoutingRules(orderedIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routingRules'] }),
  });

  const resetForm = () => {
    setFormData({
      name: '',
      condition_type: 'subject_contains',
      condition_value: '',
      action_type: 'set_category',
      action_value: '',
      is_active: true
    });
    setEditingRule(null);
    setDialogOpen(false);
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      condition_type: rule.condition_type,
      condition_value: rule.condition_value,
      action_type: rule.action_type,
      action_value: rule.action_value,
      is_active: rule.is_active
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      order: editingRule ? editingRule.order : rules.length
    };

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleToggleActive = (rule) => {
    updateMutation.mutate({
      id: rule.id,
      data: { is_active: !rule.is_active }
    });
  };

  const handleDragEnd = (result) => {
    if (!canEdit || !result.destination) return;
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    if (sourceIndex === destIndex) return;

    const reordered = Array.from(rules);
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(destIndex, 0, moved);

    queryClient.setQueryData(['routingRules'], reordered);
    reorderMutation.mutate(reordered.map((rule) => rule.id));
  };

  const getActionValueDisplay = (rule) => {
    if (rule.action_type === 'assign_to') {
      const user = users.find(u => u.id === rule.action_value);
      return user?.full_name || rule.action_value;
    }
    return rule.action_value;
  };

  const renderActionValueInput = () => {
    const fieldClass = "h-10 dark:bg-slate-800 dark:border-slate-600 dark:text-white";
    switch (formData.action_type) {
      case 'assign_to':
        return (
          <Select
            value={formData.action_value}
            onValueChange={(value) => setFormData({ ...formData, action_value: value })}
          >
            <SelectTrigger className={fieldClass}>
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'set_category':
        return (
          <Select
            value={formData.action_value}
            onValueChange={(value) => setFormData({ ...formData, action_value: value })}
          >
            <SelectTrigger className={fieldClass}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'set_priority':
        return (
          <Select
            value={formData.action_value}
            onValueChange={(value) => setFormData({ ...formData, action_value: value })}
          >
            <SelectTrigger className={fieldClass}>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map(p => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            value={formData.action_value}
            onChange={(e) => setFormData({ ...formData, action_value: e.target.value })}
            placeholder="Enter tag name"
            className={fieldClass}
          />
        );
    }
  };

  const renderRuleCard = (rule, index, dragHandleProps = {}) => {
    const conditionType = CONDITION_TYPES.find(t => t.value === rule.condition_type);
    const actionType = ACTION_TYPES.find(t => t.value === rule.action_type);
    const ConditionIcon = conditionType?.icon || Mail;
    const ActionIcon = actionType?.icon || Tag;

    return (
      <RuleCardContent
        key={rule.id}
        rule={rule}
        index={index}
        canEdit={canEdit}
        conditionType={conditionType}
        actionType={actionType}
        ConditionIcon={ConditionIcon}
        ActionIcon={ActionIcon}
        getActionValueDisplay={getActionValueDisplay}
        onToggleActive={handleToggleActive}
        onEdit={handleEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
        dragHandleProps={dragHandleProps}
      />
    );
  };

  return (
    <div className="p-6 lg:p-8 dark:bg-slate-950 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Email Routing Rules</h1>
          <p className="text-slate-500 dark:text-slate-300 mt-1">Auto-categorize and assign incoming emails</p>
        </div>

        {canEdit && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Rule
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : rules.length === 0 ? (
        <EmptyState
          icon={Route}
          title="No routing rules"
          description="Create rules to automatically categorize and assign incoming emails"
          action={canEdit ? () => setDialogOpen(true) : undefined}
          actionLabel={canEdit ? "Add First Rule" : undefined}
        />
      ) : canEdit ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="routing-rules">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-3"
              >
                {rules.map((rule, index) => (
                  <Draggable key={rule.id} draggableId={rule.id} index={index}>
                    {(draggableProvided) => (
                      <div
                        ref={draggableProvided.innerRef}
                        {...draggableProvided.draggableProps}
                      >
                        {renderRuleCard(rule, index, draggableProvided.dragHandleProps)}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, index) => renderRuleCard(rule, index))}
        </div>
      )}

      {canEdit && (
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          else setDialogOpen(open);
        }}>
          <DialogContent className="sm:max-w-lg p-0 gap-0 flex flex-col max-h-[min(85vh,680px)] overflow-hidden rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 shadow-xl">
            <div className="shrink-0 border-b border-slate-200 dark:border-slate-700 px-6 pt-6 pb-4 pr-12 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900">
              <DialogHeader className="space-y-2 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Route className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl dark:text-white">
                      {editingRule ? 'Edit Rule' : 'Add Routing Rule'}
                    </DialogTitle>
                    <DialogDescription className="mt-1 dark:text-slate-400">
                      Define when an email matches and what happens automatically
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium dark:text-slate-200">Rule name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Assign UN Tourism emails"
                  className="h-10 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden">
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50/80 dark:bg-slate-800">
                  <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5">
                    If
                  </Badge>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">When email matches</span>
                </div>
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Condition type
                    </Label>
                    <Select
                      value={formData.condition_type}
                      onValueChange={(value) => setFormData({ ...formData, condition_type: value })}
                    >
                      <SelectTrigger className="h-10 dark:bg-slate-800 dark:border-slate-600 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Condition value
                    </Label>
                    <Input
                      value={formData.condition_value}
                      onChange={(e) => setFormData({ ...formData, condition_value: e.target.value })}
                      placeholder="e.g., minutes, محضر, untourism.org"
                      className="h-10 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-center -my-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-400">
                  <ArrowDown className="h-4 w-4" />
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 dark:border-primary/30 bg-primary/[0.03] dark:bg-primary/5 overflow-hidden">
                <div className="flex items-center gap-2 border-b border-primary/10 dark:border-primary/20 px-4 py-3 bg-primary/5 dark:bg-primary/10">
                  <Badge className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 bg-primary text-primary-foreground">
                    Then
                  </Badge>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Apply this action</span>
                </div>
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Action type
                    </Label>
                    <Select
                      value={formData.action_type}
                      onValueChange={(value) => setFormData({ ...formData, action_type: value, action_value: '' })}
                    >
                      <SelectTrigger className="h-10 dark:bg-slate-800 dark:border-slate-600 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTION_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Action value
                    </Label>
                    {renderActionValueInput()}
                  </div>
                </div>
              </div>

              {formData.name && formData.condition_value && formData.action_value && (
                <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30 px-4 py-3">
                  <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Zap className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                    <p>
                      <span className="font-medium text-slate-900 dark:text-white">{formData.name}</span>
                      {' — '}
                      If {CONDITION_TYPES.find(t => t.value === formData.condition_type)?.label.toLowerCase()}{' '}
                      <span className="font-mono text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                        {formData.condition_value}
                      </span>
                      {' → '}
                      {ACTION_TYPES.find(t => t.value === formData.action_type)?.label.toLowerCase()}{' '}
                      <span className="font-mono text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                        {formData.action_type === 'assign_to'
                          ? (users.find(u => u.id === formData.action_value)?.full_name || formData.action_value)
                          : formData.action_value}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="shrink-0 border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50/90 dark:bg-slate-900/90 sm:justify-end gap-2">
              <Button variant="outline" onClick={resetForm} className="min-w-[96px]">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.condition_value || !formData.action_value}
                className="min-w-[120px]"
              >
                {editingRule ? 'Update Rule' : 'Create Rule'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
