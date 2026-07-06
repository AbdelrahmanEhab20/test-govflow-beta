import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/api/authApi';
import {
  getNotificationPreferencesForUser,
  updateNotificationPreference,
  createNotificationPreference,
} from '@/api/notificationPreferencesApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, CheckCircle2, AlertCircle } from 'lucide-react';

export default function NotificationPreferences() {
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notificationPreferences', user?.id],
    queryFn: () => getNotificationPreferencesForUser(user?.id),
    enabled: !!user?.id,
  });

  const [formData, setFormData] = useState(preferences || {
    user_id: user?.id,
    user_email: user?.email,
    notify_task_assigned: true,
    notify_task_assigned_email: true,
    notify_profile_updated: true,
    notify_routing_rule_changes: true,
    notify_team_performance: true,
    notify_status_changes: true,
    notify_due_soon: true,
    notify_overdue: true,
    email_digest_frequency: 'immediate'
  });

  React.useEffect(() => {
    if (preferences) {
      setFormData(preferences);
    }
  }, [preferences]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences?.id) {
        return updateNotificationPreference(preferences.id, data);
      }
      return createNotificationPreference(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  });

  const handleToggle = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleFrequencyChange = (value) => {
    setFormData(prev => ({
      ...prev,
      email_digest_frequency: value
    }));
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Notification Preferences</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-300">Manage how you receive notifications and updates</p>
        </div>

        {saved && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300 text-sm font-medium">Preferences saved successfully</span>
          </div>
        )}

        {/* In-App Notifications */}
        <Card className="mb-6 dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <CardTitle>In-App Notifications</CardTitle>
            <CardDescription>Notifications that appear in your notification center</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Task Assigned</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Notify when a task is assigned to you</p>
              </div>
              <Switch
                checked={formData.notify_task_assigned}
                onCheckedChange={() => handleToggle('notify_task_assigned')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Profile Updates</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Notify when admin updates your profile</p>
              </div>
              <Switch
                checked={formData.notify_profile_updated}
                onCheckedChange={() => handleToggle('notify_profile_updated')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Status Changes</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Notify when task status changes</p>
              </div>
              <Switch
                checked={formData.notify_status_changes}
                onCheckedChange={() => handleToggle('notify_status_changes')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Due Soon</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Notify when tasks are due soon</p>
              </div>
              <Switch
                checked={formData.notify_due_soon}
                onCheckedChange={() => handleToggle('notify_due_soon')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Overdue Tasks</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Notify about overdue tasks</p>
              </div>
              <Switch
                checked={formData.notify_overdue}
                onCheckedChange={() => handleToggle('notify_overdue')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Routing Rule Changes</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Notify when routing rules are created or modified</p>
              </div>
              <Switch
                checked={formData.notify_routing_rule_changes}
                onCheckedChange={() => handleToggle('notify_routing_rule_changes')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Team Performance</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Notify about team performance changes</p>
              </div>
              <Switch
                checked={formData.notify_team_performance}
                onCheckedChange={() => handleToggle('notify_team_performance')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card className="mb-6 dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Email Notifications</CardTitle>
            <CardDescription>Notifications sent to your email address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Task Assignment Emails</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Send email when a task is assigned to you</p>
              </div>
              <Switch
                checked={formData.notify_task_assigned_email}
                onCheckedChange={() => handleToggle('notify_task_assigned_email')}
              />
            </div>

            <div className="border-t dark:border-slate-700 pt-4">
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Email Digest Frequency
              </label>
              <Select value={formData.email_digest_frequency} onValueChange={handleFrequencyChange}>
                <SelectTrigger className="w-full dark:bg-slate-800 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate - Send right away</SelectItem>
                  <SelectItem value="daily">Daily Digest - Once per day</SelectItem>
                  <SelectItem value="weekly">Weekly Digest - Once per week</SelectItem>
                  <SelectItem value="never">Never - Turn off email notifications</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => setFormData(preferences || {})}
            className="dark:border-slate-700 dark:text-slate-300"
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </div>
  );
}