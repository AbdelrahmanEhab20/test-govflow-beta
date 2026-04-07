import React, { useState } from "react";
import { listRoutingRules, createRoutingRule, updateRoutingRule, deleteRoutingRule } from "@/api/routingRulesApi";
import { listUsers } from "@/api/usersApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const getActionValueDisplay = (rule) => {
    if (rule.action_type === 'assign_to') {
      const user = users.find(u => u.id === rule.action_value);
      return user?.full_name || rule.action_value;
    }
    return rule.action_value;
  };

  const renderActionValueInput = () => {
    switch (formData.action_type) {
      case 'assign_to':
        return (
          <Select 
            value={formData.action_value} 
            onValueChange={(value) => setFormData({ ...formData, action_value: value })}
          >
            <SelectTrigger>
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
            <SelectTrigger>
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
            <SelectTrigger>
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
            placeholder="Enter value"
          />
        );
    }
  };

  return (
    <div className="p-6 lg:p-8 dark:bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Email Routing Rules</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Auto-categorize and assign incoming emails</p>
        </div>
        
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {/* Rules List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : rules.length === 0 ? (
        <EmptyState
          icon={Route}
          title="No routing rules"
          description="Create rules to automatically categorize and assign incoming emails"
          action={() => setDialogOpen(true)}
          actionLabel="Add First Rule"
        />
      ) : (
        <div className="space-y-3">
          {rules.map((rule, index) => {
            const conditionType = CONDITION_TYPES.find(t => t.value === rule.condition_type);
            const actionType = ACTION_TYPES.find(t => t.value === rule.action_type);
            const ConditionIcon = conditionType?.icon || Mail;
            const ActionIcon = actionType?.icon || Tag;

            return (
              <Card 
                key={rule.id}
                className={`dark:border-slate-700 ${!rule.is_active ? 'opacity-50' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                      <GripVertical className="w-5 h-5 cursor-move" />
                      <span className="text-sm font-mono">#{index + 1}</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-slate-900 dark:text-white">{rule.name}</span>
                        {!rule.is_active && (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
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

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => handleToggleActive(rule)}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEdit(rule)}
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
                              onClick={() => deleteMutation.mutate(rule.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Rule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        else setDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-lg dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {editingRule ? 'Edit Rule' : 'Add Routing Rule'}
            </DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Define conditions and actions for automatic email processing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="dark:text-slate-200">Rule Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Assign UN Tourism emails"
                className="mt-1.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg space-y-4">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">When email...</p>
              
              <div>
                <Label className="dark:text-slate-200">Condition Type</Label>
                <Select 
                  value={formData.condition_type} 
                  onValueChange={(value) => setFormData({ ...formData, condition_type: value })}
                >
                  <SelectTrigger className="mt-1.5 dark:bg-slate-600 dark:border-slate-500 dark:text-white">
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

              <div>
                <Label className="dark:text-slate-200">Condition Value</Label>
                <Input
                  value={formData.condition_value}
                  onChange={(e) => setFormData({ ...formData, condition_value: e.target.value })}
                  placeholder="e.g., minutes, محضر, untourism.org"
                  className="mt-1.5 dark:bg-slate-600 dark:border-slate-500 dark:text-white"
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-4">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Then...</p>
              
              <div>
                <Label className="dark:text-slate-200">Action Type</Label>
                <Select 
                   value={formData.action_type} 
                   onValueChange={(value) => setFormData({ ...formData, action_type: value, action_value: '' })}
                 >
                   <SelectTrigger className="mt-1.5 dark:bg-slate-600 dark:border-slate-500 dark:text-white">
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

              <div>
                <Label className="dark:text-slate-200">Action Value</Label>
                <div className="mt-1.5">
                  {renderActionValueInput()}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.name || !formData.condition_value || !formData.action_value}
            >
              {editingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}