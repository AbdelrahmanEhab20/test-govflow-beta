import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Repeat2 } from 'lucide-react';

export default function RecurringTaskSettings({ formData, onChange }) {
  return (
    <Card className="dark:bg-slate-900 dark:border-slate-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Repeat2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <CardTitle>Recurring Task Settings</CardTitle>
        </div>
        <CardDescription>Configure task recurrence pattern</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="dark:text-white">Make this a recurring task</Label>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Task will automatically repeat</p>
          </div>
          <Switch
            checked={formData.is_recurring}
            onCheckedChange={(checked) => onChange({ is_recurring: checked })}
          />
        </div>

        {formData.is_recurring && (
          <>
            <div>
              <Label className="dark:text-slate-200">Recurrence Pattern</Label>
              <Select 
                value={formData.recurrence_pattern || 'weekly'} 
                onValueChange={(value) => onChange({ recurrence_pattern: value })}
              >
                <SelectTrigger className="mt-1.5 dark:bg-slate-800 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="dark:text-slate-200">Recurrence End Date</Label>
              <Input
                type="date"
                value={formData.recurrence_end_date || ''}
                onChange={(e) => onChange({ recurrence_end_date: e.target.value })}
                className="mt-1.5 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Leave empty for no end date</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}