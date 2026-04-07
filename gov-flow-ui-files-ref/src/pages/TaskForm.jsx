import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTaskById, createTask, updateTask } from "@/api/tasksApi";
import { getEmailById, updateEmail } from "@/api/emailApi";
import { listUsers } from "@/api/usersApi";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { ArrowLeft, Save, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AssignmentSuggestions from "../components/tasks/AssignmentSuggestions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const STATUS_OPTIONS = [
{ value: "not_started", label: "Not Started | لم يبدأ" },
{ value: "in_progress", label: "In Progress | قيد التنفيذ" },
{ value: "completed", label: "Completed | مكتمل" },
{ value: "on_hold", label: "On Hold | مؤجل" },
{ value: "delayed", label: "Delayed | متأخر" }];


const PRIORITY_OPTIONS = [
{ value: "low", label: "Low" },
{ value: "medium", label: "Medium" },
{ value: "high", label: "High" },
{ value: "urgent", label: "Urgent" }];


export default function TaskForm() {
  const urlParams = new URLSearchParams(window.location.search);
  const taskId = urlParams.get('id');
  const emailId = urlParams.get('emailId');
  const isEditing = !!taskId;

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    pillar: '',
    brief_description: '',
    lead_user_id: '',
    support_users: [],
    deliverables: '',
    start_date: '',
    due_date: '',
    status: 'not_started',
    completion_percent: 0,
    priority: 'medium',
    stakeholders: [],
    dependencies: '',
    notes: '',
    tags: [],
    source_email_id: emailId || ''
  });

  const [newTag, setNewTag] = useState('');
  const [newStakeholder, setNewStakeholder] = useState('');
  const [aiLoading, setAiLoading] = useState({ description: false, suggestions: false, categories: false, priority: false });

  const { data: existingTask, isLoading: taskLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getTaskById(taskId),
    enabled: isEditing
  });

  const { data: email } = useQuery({
    queryKey: ['email', emailId],
    queryFn: () => getEmailById(emailId),
    enabled: !!emailId && !isEditing
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers()
  });

  useEffect(() => {
    if (existingTask) {
      setFormData(existingTask);
    }
  }, [existingTask]);

  useEffect(() => {
    if (email && !isEditing) {
      setFormData((prev) => ({
        ...prev,
        pillar: email.subject || '',
        brief_description: email.body_preview || email.body_text || '',
        source_email_id: email.id
      }));
    }
  }, [email, isEditing]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const result = await createTask(data);
      if (emailId) {
        await updateEmail(emailId, {
          status_in_system: 'converted',
          linked_task_id: result.id,
        });
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      navigate(createPageUrl('Tasks'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updateTask(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      navigate(createPageUrl('Tasks'));
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const leadUser = users.find((u) => u.id === formData.lead_user_id);
    const supportUserNames = formData.support_users?.map(
      (id) => users.find((u) => u.id === id)?.full_name
    ).filter(Boolean);

    const dataToSave = {
      ...formData,
      lead_user_name: leadUser?.full_name,
      support_user_names: supportUserNames,
      last_activity_at: new Date().toISOString()
    };

    if (isEditing) {
      updateMutation.mutate(dataToSave);
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const handleAddTag = () => {
    if (newTag && !formData.tags?.includes(newTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), newTag]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) || []
    }));
  };

  const handleAddStakeholder = () => {
    if (newStakeholder && !formData.stakeholders?.includes(newStakeholder)) {
      setFormData((prev) => ({
        ...prev,
        stakeholders: [...(prev.stakeholders || []), newStakeholder]
      }));
      setNewStakeholder('');
    }
  };

  const handleRemoveStakeholder = (stakeholder) => {
    setFormData((prev) => ({
      ...prev,
      stakeholders: prev.stakeholders?.filter((s) => s !== stakeholder) || []
    }));
  };

  const handleAIGenerateDescription = async () => {
    if (!formData.pillar) {
      alert('Please enter a task title first');
      return;
    }

    setAiLoading((prev) => ({ ...prev, description: true }));
    try {
      const response = await base44.functions.invoke('generateTaskDescription', {
        objective: formData.pillar
      });

      setFormData((prev) => ({
        ...prev,
        brief_description: response.data.description,
        support_users: response.data.subtasks?.slice(0, 3) || []
      }));
    } catch (error) {
      alert('Failed to generate description');
    } finally {
      setAiLoading((prev) => ({ ...prev, description: false }));
    }
  };

  const handleAISuggestMembers = async () => {
    if (!formData.pillar || !formData.brief_description) {
      alert('Please enter task title and description first');
      return;
    }

    setAiLoading((prev) => ({ ...prev, suggestions: true }));
    try {
      const response = await base44.functions.invoke('suggestTeamMembers', {
        taskTitle: formData.pillar,
        taskDescription: formData.brief_description
      });

      const suggestedIds = response.data.suggestions?.
      filter((s) => s.userId).
      map((s) => s.userId) || [];

      setFormData((prev) => ({
        ...prev,
        support_users: [...new Set([...prev.support_users, ...suggestedIds])]
      }));
    } catch (error) {
      alert('Failed to suggest team members');
    } finally {
      setAiLoading((prev) => ({ ...prev, suggestions: false }));
    }
  };

  const handleAICategorize = async () => {
    if (!formData.pillar || !formData.brief_description) {
      alert('Please enter task title and description first');
      return;
    }

    setAiLoading((prev) => ({ ...prev, categories: true }));
    try {
      const response = await base44.functions.invoke('categorizeTasks', {
        taskTitle: formData.pillar,
        taskDescription: formData.brief_description,
        priority: formData.priority
      });

      setFormData((prev) => ({
        ...prev,
        priority: response.data.suggestedPriority || prev.priority,
        tags: [...new Set([...(prev.tags || []), ...response.data.tags])]
      }));
    } catch (error) {
      alert('Failed to categorize task');
    } finally {
      setAiLoading((prev) => ({ ...prev, categories: false }));
    }
  };

  const handleAIPrioritizeTask = async () => {
    if (!formData.pillar || !formData.brief_description) {
      alert('Please enter task title and description first');
      return;
    }

    setAiLoading((prev) => ({ ...prev, priority: true }));
    try {
      const response = await base44.functions.invoke('prioritizeTask', {
        taskTitle: formData.pillar,
        taskDescription: formData.brief_description,
        dueDate: formData.due_date,
        dependencies: formData.dependencies,
        currentPriority: formData.priority,
        assignedUserCount: formData.support_users?.length || 0,
        status: formData.status
      });

      setFormData((prev) => ({
        ...prev,
        priority: response.data.suggestedPriority
      }));
    } catch (error) {
      alert('Failed to analyze priority');
    } finally {
      setAiLoading((prev) => ({ ...prev, priority: false }));
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (taskLoading && isEditing) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>);

  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-slate-500 text-2xl font-bold">
            {isEditing ? 'Edit Task' : 'New Task'}
          </h1>
          {emailId && !isEditing &&
          <p className="text-sm text-purple-600 mt-1">Creating from email</p>
          }
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Basic Information</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAIGenerateDescription}
                disabled={aiLoading.description || !formData.pillar}>

                <Wand2 className="w-4 h-4 mr-1" />
                {aiLoading.description ? 'Generating...' : 'AI Generate'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pillar">Initiative / Task Title *</Label>
              <Input
                id="pillar"
                value={formData.pillar}
                onChange={(e) => setFormData((prev) => ({ ...prev, pillar: e.target.value }))}
                placeholder="Enter initiative or task title"
                required
                className="mt-1.5" />

            </div>

            <div>
              <Label htmlFor="brief_description">Brief Description</Label>
              <Textarea
                id="brief_description"
                value={formData.brief_description}
                onChange={(e) => setFormData((prev) => ({ ...prev, brief_description: e.target.value }))}
                placeholder="Describe the task..."
                rows={3}
                className="mt-1.5" />

            </div>

            <div>
              <Label htmlFor="deliverables">Deliverables</Label>
              <Textarea
                id="deliverables"
                value={formData.deliverables}
                onChange={(e) => setFormData((prev) => ({ ...prev, deliverables: e.target.value }))}
                placeholder="List expected deliverables..."
                rows={3}
                className="mt-1.5" />

            </div>
          </CardContent>
        </Card>

        {/* AI Assignment Suggestions */}
        {formData.pillar && !isEditing &&
        <AssignmentSuggestions
          taskId={taskId}
          taskData={formData}
          onAssigned={() => {
            setFormData((prev) => ({ ...prev, lead_user_id: '' }));
          }} />

        }

        {/* Assignment */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Assignment</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAISuggestMembers}
                disabled={aiLoading.suggestions || !formData.pillar || !formData.brief_description}>

                <Wand2 className="w-4 h-4 mr-1" />
                {aiLoading.suggestions ? 'Suggesting...' : 'AI Suggest'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Lead Owner</Label>
                <Select
                  value={formData.lead_user_id}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, lead_user_id: value }))}>

                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) =>
                    <SelectItem key={user.id} value={user.id}>
                        {user.full_name}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label>Priority</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAIPrioritizeTask}
                    disabled={aiLoading.priority || !formData.pillar || !formData.brief_description}
                    className="h-6 px-2 text-xs">

                    <Wand2 className="w-3 h-3 mr-1" />
                    {aiLoading.priority ? 'Analyzing...' : 'AI'}
                  </Button>
                </div>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}>

                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((opt) =>
                    <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Stakeholders</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  value={newStakeholder}
                  onChange={(e) => setNewStakeholder(e.target.value)}
                  placeholder="Add stakeholder..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStakeholder())} />

                <Button type="button" variant="outline" onClick={handleAddStakeholder}>
                  Add
                </Button>
              </div>
              {formData.stakeholders?.length > 0 &&
              <div className="flex flex-wrap gap-2 mt-2">
                  {formData.stakeholders.map((s) =>
                <Badge key={s} variant="secondary" className="pr-1">
                      {s}
                      <button
                    type="button"
                    onClick={() => handleRemoveStakeholder(s)}
                    className="ml-1 hover:text-red-600">

                        ×
                      </button>
                    </Badge>
                )}
                </div>
              }
            </div>
          </CardContent>
        </Card>

        {/* Timeline & Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timeline & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal mt-1.5">

                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ?
                      format(new Date(formData.start_date), 'PPP') :
                      "Select date"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.start_date ? new Date(formData.start_date) : undefined}
                      onSelect={(date) => setFormData((prev) => ({
                        ...prev,
                        start_date: date ? format(date, 'yyyy-MM-dd') : ''
                      }))} />

                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal mt-1.5">

                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.due_date ?
                      format(new Date(formData.due_date), 'PPP') :
                      "Select date"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.due_date ? new Date(formData.due_date) : undefined}
                      onSelect={(date) => setFormData((prev) => ({
                        ...prev,
                        due_date: date ? format(date, 'yyyy-MM-dd') : ''
                      }))} />

                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => {
                    const newData = { ...formData, status: value };
                    if (value === 'completed') {
                      newData.completion_percent = 100;
                    }
                    setFormData(newData);
                  }}>

                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) =>
                    <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Completion Percentage</Label>
                <Select
                  value={String(formData.completion_percent)}
                  onValueChange={(value) => {
                    const percent = parseInt(value);
                    const newData = { ...formData, completion_percent: percent };
                    if (percent === 100 && formData.status !== 'completed') {
                      newData.status = 'completed';
                    } else if (percent < 100 && formData.status === 'completed') {
                      newData.status = 'in_progress';
                    }
                    setFormData(newData);
                  }}>

                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((v) =>
                    <SelectItem key={v} value={String(v)}>{v}%</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Additional Information</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAICategorize}
                disabled={aiLoading.categories || !formData.pillar || !formData.brief_description}>

                <Wand2 className="w-4 h-4 mr-1" />
                {aiLoading.categories ? 'Analyzing...' : 'AI Categorize'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="dependencies">Dependencies / Pending Inputs</Label>
              <Textarea
                id="dependencies"
                value={formData.dependencies}
                onChange={(e) => setFormData((prev) => ({ ...prev, dependencies: e.target.value }))}
                placeholder="List any dependencies or pending inputs..."
                rows={2}
                className="mt-1.5" />

            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
                rows={2}
                className="mt-1.5" />

            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())} />

                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              {formData.tags?.length > 0 &&
              <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) =>
                <Badge key={tag} variant="secondary" className="pr-1">
                      {tag}
                      <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-red-600">

                        ×
                      </button>
                    </Badge>
                )}
                </div>
              }
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </div>);

}