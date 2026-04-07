import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

const COLOR_OPTIONS = [
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'red', label: 'Red' },
  { value: 'purple', label: 'Purple' },
];

export default function WorkflowStageForm({ stage, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue',
    require_approval: false,
    approval_required_from: [],
    is_active: true,
  });

  useEffect(() => {
    if (stage) {
      setFormData(stage);
    }
  }, [stage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Stage name is required');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name" className="dark:text-slate-200">Stage Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Planning, In Progress, Review"
          className="mt-1.5 dark:bg-slate-800 dark:border-slate-700"
          required
        />
      </div>

      <div>
        <Label htmlFor="description" className="dark:text-slate-200">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="What is this stage used for?"
          rows={3}
          className="mt-1.5 dark:bg-slate-800 dark:border-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="color" className="dark:text-slate-200">Color</Label>
          <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
            <SelectTrigger className="mt-1.5 dark:bg-slate-800 dark:border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLOR_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <Label className="dark:text-slate-200">Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div>
          <Label className="dark:text-slate-200 font-medium">Requires Approval</Label>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Tasks must be approved before moving to next stage
          </p>
        </div>
        <Switch
          checked={formData.require_approval}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, require_approval: checked }))}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {stage ? 'Update Stage' : 'Create Stage'}
        </Button>
      </div>
    </form>
  );
}