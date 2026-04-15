import React, { useState } from "react";
import { getCurrentUser, updateMe } from "@/api/authApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Save,
  Bell,
  Mail,
  Shield,
  Globe,
  Loader2,
  Check
} from
  "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { getOutlookStatus, startOutlookConnect } from "@/api/outlookApi";
import { getGmailStatus, startGmailConnect } from "@/api/googleApi";
import { useNodeBackend } from "@/api/nodeBackendClient";
import AddMailboxDialog from "@/components/email/AddMailboxDialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState('notifications');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addMailboxOpen, setAddMailboxOpen] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser()
  });
  const {
    data: outlookStatus,
    isLoading: isLoadingOutlookStatus,
    refetch: refetchOutlookStatus,
  } = useQuery({
    queryKey: ['outlookStatus'],
    queryFn: () => getOutlookStatus(),
    enabled: useNodeBackend,
  });
  const {
    data: gmailStatus,
    isLoading: isLoadingGmailStatus,
    refetch: refetchGmailStatus,
  } = useQuery({
    queryKey: ['gmailStatus'],
    queryFn: () => getGmailStatus(),
    enabled: useNodeBackend,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_assignments: true,
    email_due_reminders: true,
    email_mentions: true,
    in_app_all: true
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated."
      });
    }
  });

  React.useEffect(() => {
    if (user?.notification_preferences) {
      setNotificationSettings(user.notification_preferences);
    }
  }, [user]);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('ms_connected');
    const googleConnected = params.get('google_connected');
    const reason = params.get('reason');

    if (connected === '1') {
      toast({
        title: 'Microsoft connected',
        description: 'Your Outlook mailbox is now connected.',
      });
      refetchOutlookStatus();
      params.delete('ms_connected');
      params.delete('reason');
      const newSearch = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`);
    }

    if (connected === '0') {
      toast({
        variant: 'destructive',
        title: 'Microsoft connection failed',
        description: reason || 'OAuth flow did not complete.',
      });
      params.delete('ms_connected');
      params.delete('reason');
      const newSearch = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`);
    }
    if (googleConnected === '1') {
      toast({
        title: 'Google connected',
        description: 'Your Gmail mailbox is now connected.',
      });
      refetchGmailStatus();
      params.delete('google_connected');
      params.delete('reason');
      const newSearch = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`);
    }

    if (googleConnected === '0') {
      toast({
        variant: 'destructive',
        title: 'Google connection failed',
        description: reason || 'OAuth flow did not complete.',
      });
      params.delete('google_connected');
      params.delete('reason');
      const newSearch = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`);
    }
  }, [toast, refetchOutlookStatus, refetchGmailStatus]);

  const handleSaveNotifications = () => {
    updateMutation.mutate({
      notification_preferences: notificationSettings
    });
  };

  const handleConnectMicrosoft = async () => {
    try {
      await startOutlookConnect();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Unable to start Microsoft login',
        description: error?.message || 'Please verify backend Microsoft OAuth config.',
      });
    }
  };

  const handleConnectGoogle = async () => {
    try {
      await startGmailConnect();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Unable to start Google login',
        description: error?.message || 'Please verify backend Google OAuth config.',
      });
    }
  };

  const deleteMailboxMutation = useMutation({
    mutationFn: async (mailboxId) => {
      const mailboxes = user?.mailboxes || [];
      const updatedMailboxes = mailboxes.filter((m) => m.id !== mailboxId);
      if (mailboxes.find((m) => m.id === mailboxId)?.isActive && updatedMailboxes.length > 0) {
        updatedMailboxes[0].isActive = true;
      }
      await updateMe({ mailboxes: updatedMailboxes });
      return mailboxId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });

  const getProviderColor = (provider) => {
    switch (provider) {
      case 'outlook':
        return 'bg-blue-100 text-blue-700';
      case 'gmail':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>);

  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-slate-500 text-2xl font-bold">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your preferences and system configuration</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" />
            Email Integration
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2">
            <Globe className="w-4 h-4" />
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-slate-600 font-medium">Email Notifications</h4>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Task Assignments</Label>
                    <p className="text-sm text-slate-500">Get notified when you're assigned to a task</p>
                  </div>
                  <Switch
                    checked={notificationSettings.email_assignments}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({ ...prev, email_assignments: checked }))
                    } />

                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Due Date Reminders</Label>
                    <p className="text-sm text-slate-500">Receive reminders before tasks are due</p>
                  </div>
                  <Switch
                    checked={notificationSettings.email_due_reminders}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({ ...prev, email_due_reminders: checked }))
                    } />

                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mentions</Label>
                    <p className="text-sm text-slate-500">Get notified when someone mentions you</p>
                  </div>
                  <Switch
                    checked={notificationSettings.email_mentions}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({ ...prev, email_mentions: checked }))
                    } />

                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-slate-500 font-medium">In-App Notifications</h4>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>All Notifications</Label>
                    <p className="text-sm text-slate-500">Show notifications in the app</p>
                  </div>
                  <Switch
                    checked={notificationSettings.in_app_all}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({ ...prev, in_app_all: checked }))
                    } />

                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveNotifications} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ?
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> :

                    <Save className="w-4 h-4 mr-2" />
                  }
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Integration</CardTitle>
              <CardDescription>
                Configure department mailbox connection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Provider Connections</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Connect Outlook and Gmail with OAuth, then choose mailbox in Email Inbox.
                    </p>
                  </div>
                </div>
              </div>

              {useNodeBackend ? (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">Connected Mailboxes</p>
                        <p className="text-xs text-slate-500">
                          Add Outlook or Gmail via OAuth. Mailboxes appear in Email Inbox selector.
                        </p>
                      </div>
                      <Button onClick={() => setAddMailboxOpen(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Mailbox
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {(user?.mailboxes || []).length === 0 ? (
                        <div className="p-3 bg-slate-50 rounded text-sm text-slate-600">
                          No mailboxes connected yet.
                        </div>
                      ) : (
                        (user?.mailboxes || []).map((mailbox) => (
                          <div
                            key={mailbox.id}
                            className="flex items-center justify-between gap-3 p-3 rounded border bg-white"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <p className="font-medium text-slate-900 truncate">
                                  {mailbox.displayName || mailbox.email}
                                </p>
                                <Badge variant="secondary" className={`text-xs ${getProviderColor(mailbox.provider)}`}>
                                  {mailbox.provider}
                                </Badge>
                                {mailbox.isActive && (
                                  <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                                    active
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate">{mailbox.email}</p>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteMailboxMutation.mutate(mailbox.id)}
                              disabled={deleteMailboxMutation.isPending}
                              className="gap-2"
                              title="Remove mailbox"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">Microsoft 365 (Outlook)</p>
                        <p className="text-xs text-slate-500">{outlookStatus?.mailbox?.email || 'Not connected'}</p>
                      </div>
                      <Button onClick={handleConnectMicrosoft} disabled={isLoadingOutlookStatus}>
                        {outlookStatus?.connected ? 'Reconnect Microsoft' : 'Connect Microsoft'}
                      </Button>
                    </div>
                    <div className={`flex items-center gap-2 p-2 rounded ${outlookStatus?.connected ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                      {outlookStatus?.connected ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs text-emerald-700">Outlook connected</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 text-amber-600" />
                          <span className="text-xs text-amber-700">Outlook not connected</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">Google (Gmail)</p>
                        <p className="text-xs text-slate-500">{gmailStatus?.mailbox?.email || 'Not connected'}</p>
                      </div>
                      <Button onClick={handleConnectGoogle} disabled={isLoadingGmailStatus}>
                        {gmailStatus?.connected ? 'Reconnect Google' : 'Connect Google'}
                      </Button>
                    </div>
                    <div className={`flex items-center gap-2 p-2 rounded ${gmailStatus?.connected ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                      {gmailStatus?.connected ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs text-emerald-700">Gmail connected</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 text-amber-600" />
                          <span className="text-xs text-amber-700">Gmail not connected</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                  <Mail className="w-5 h-5 text-amber-600" />
                  <span className="text-sm text-amber-700">Switch to node backend mode to enable OAuth integrations</span>
                </div>
              )}

              <AddMailboxDialog
                open={addMailboxOpen}
                onOpenChange={setAddMailboxOpen}
                user={user}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                System-wide preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Organization Name</Label>
                  <Input
                    value={user?.organization_name}
                    onChange={(e) => setUser({ ...user, organization_name: e.target.value })}
                    className="mt-1.5 bg-slate-50" />

                </div>

                <div>
                  <Label>Default Language</Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Button variant="outline" className="flex-1">
                      English
                    </Button>
                    <Button variant="outline" className="flex-1">
                      العربية
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Status labels and UI elements will use both languages
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-slate-900">Security</h4>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-slate-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-700">
                        This system uses role-based access control. Contact your administrator
                        to modify user permissions.
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Your role: <span className="font-medium capitalize">{user?.role || 'user'}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);

}