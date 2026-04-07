import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function KanbanFilters({ filters, onFiltersChange, users }) {
  return (
    <Card className="dark:bg-slate-800 dark:border-slate-700">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Assignee Filter */}
          <div>
            <Label className="text-sm font-medium dark:text-slate-200 mb-2 block">
              Assigned to
            </Label>
            <Select value={filters.assignee} onValueChange={(value) => onFiltersChange({ ...filters, assignee: value })}>
              <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600">
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All users</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div>
            <Label className="text-sm font-medium dark:text-slate-200 mb-2 block">
              Priority
            </Label>
            <Select value={filters.priority} onValueChange={(value) => onFiltersChange({ ...filters, priority: value })}>
              <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600">
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* My Tasks Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <Label className="text-sm font-medium dark:text-slate-200 cursor-pointer">
              My tasks only
            </Label>
            <Switch
              checked={filters.myTasks}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, myTasks: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}