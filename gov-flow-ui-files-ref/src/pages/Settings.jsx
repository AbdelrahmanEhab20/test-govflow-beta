import React, { useState } from "react";
import { getCurrentUser, updateMe, updateBranding, uploadBrandLogo } from "@/api/authApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Save,
  Bell,
  Mail,
  Shield,
  Globe,
  Loader2,
  Check,
  Palette,
  Upload
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
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import { useMailboxOAuthCallback } from "@/hooks/useMailboxOAuthCallback";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

function resolveMediaUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) {
    const apiBase = import.meta.env.VITE_API_BASE_URL;
    if (!apiBase) return url;
    try {
      return new URL(url, apiBase).toString();
    } catch {
      return url;
    }
  }
  return url;
}

const EMPTY_BRANDING = {
  appName: '',
  companyName: '',
  sidebarTitle: '',
  tagline: '',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#2563eb',
  secondaryColor: '#0f172a',
  accentColor: '#6366f1',
  supportEmail: '',
  websiteUrl: '',
  envLabel: 'beta',
  showGovflowCredit: true,
  govflowCreditText: 'Powered by GovFlow',
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState('notifications');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addMailboxOpen, setAddMailboxOpen] = useState(false);
  const [mailboxToDelete, setMailboxToDelete] = useState(null);
  const { appPublicSettings, applyPublicSettings } = useAuth();
  const [brandingForm, setBrandingForm] = useState(EMPTY_BRANDING);
  const [logoUploading, setLogoUploading] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser()
  });
  const isAdmin = user?.role === 'admin';
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
    const branding = appPublicSettings?.public_settings || {};
    setBrandingForm({
      ...EMPTY_BRANDING,
      ...branding,
      showGovflowCredit: branding.showGovflowCredit !== false,
    });
  }, [appPublicSettings]);

  const brandingMutation = useMutation({
    mutationFn: (data) => updateBranding(data),
    onSuccess: (result) => {
      applyPublicSettings(result);
      toast({
        title: 'Branding saved',
        description: 'White-label settings are live for this demo.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Unable to save branding',
        description: error?.message || 'Please try again.',
      });
    },
  });

  const handleBrandingField = (field, value) => {
    setBrandingForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveBranding = () => {
    brandingMutation.mutate({
      appName: brandingForm.appName,
      companyName: brandingForm.companyName,
      sidebarTitle: brandingForm.sidebarTitle,
      tagline: brandingForm.tagline,
      logoUrl: brandingForm.logoUrl,
      faviconUrl: brandingForm.faviconUrl,
      primaryColor: brandingForm.primaryColor,
      secondaryColor: brandingForm.secondaryColor,
      accentColor: brandingForm.accentColor,
      supportEmail: brandingForm.supportEmail,
      websiteUrl: brandingForm.websiteUrl,
      envLabel: brandingForm.envLabel,
      showGovflowCredit: brandingForm.showGovflowCredit,
      govflowCreditText: brandingForm.govflowCreditText,
    });
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setLogoUploading(true);
    try {
      const result = await uploadBrandLogo(file);
      applyPublicSettings(result);
      setBrandingForm((prev) => ({
        ...prev,
        logoUrl: result?.logoUrl || result?.public_settings?.logoUrl || prev.logoUrl,
      }));
      toast({
        title: 'Logo updated',
        description: 'Brand logo uploaded successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Logo upload failed',
        description: error?.message || 'Please try again.',
      });
    } finally {
      setLogoUploading(false);
    }
  };

  useMailboxOAuthCallback({ refetchOutlookStatus, refetchGmailStatus });

  const handleSaveNotifications = () => {
    updateMutation.mutate({
      notification_preferences: notificationSettings
    });
  };

  const handleConnectMicrosoft = async () => {
    try {
      await startOutlookConnect('/Settings');
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
      await startGmailConnect('/Settings');
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="text-slate-500 dark:text-slate-200 mt-1">Manage your preferences and system configuration</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-slate-100/90 dark:bg-slate-800/80">
          <TabsTrigger
            value="notifications"
            className="gap-2 text-slate-700 dark:text-slate-200 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white"
          >
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="email"
            className="gap-2 text-slate-700 dark:text-slate-200 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white"
          >
            <Mail className="w-4 h-4" />
            Email Integration
          </TabsTrigger>
          <TabsTrigger
            value="general"
            className="gap-2 text-slate-700 dark:text-slate-200 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white"
          >
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
                <h4 className="text-slate-600 dark:text-slate-300 font-medium">Email Notifications</h4>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Task Assignments</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Get notified when you're assigned to a task</p>
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
                    <p className="text-sm text-slate-500 dark:text-slate-400">Receive reminders before tasks are due</p>
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
                    <p className="text-sm text-slate-500 dark:text-slate-400">Get notified when someone mentions you</p>
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
                <h4 className="text-slate-500 dark:text-slate-300 font-medium">In-App Notifications</h4>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>All Notifications</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Show notifications in the app</p>
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
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/40">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-200">Provider Connections</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
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
                        <p className="font-medium text-slate-900 dark:text-slate-100">Connected Mailboxes</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
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
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded text-sm text-slate-600 dark:text-slate-300">
                          No mailboxes connected yet.
                        </div>
                      ) : (
                        (user?.mailboxes || []).map((mailbox) => (
                          <div
                            key={mailbox.id}
                            className="flex items-center justify-between gap-3 p-3 rounded border bg-white dark:bg-slate-900"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                  {mailbox.displayName || mailbox.email}
                                </p>
                                <Badge variant="secondary" className={`text-xs ${getProviderColor(mailbox.provider)}`}>
                                  {mailbox.provider}
                                </Badge>
                                {mailbox.isActive && (
                                  <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                    active
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{mailbox.email}</p>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setMailboxToDelete(mailbox)}
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
                        <p className="font-medium text-slate-900 dark:text-slate-100">Microsoft 365 (Outlook)</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{outlookStatus?.mailbox?.email || 'Not connected'}</p>
                      </div>
                      <Button onClick={handleConnectMicrosoft} disabled={isLoadingOutlookStatus}>
                        {outlookStatus?.connected ? 'Reconnect Microsoft' : 'Connect Microsoft'}
                      </Button>
                    </div>
                    <div className={`flex items-center gap-2 p-2 rounded ${outlookStatus?.connected ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                      {outlookStatus?.connected ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs text-emerald-700 dark:text-emerald-300">Outlook connected</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 text-amber-600" />
                          <span className="text-xs text-amber-700 dark:text-amber-300">Outlook not connected</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">Google (Gmail)</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{gmailStatus?.mailbox?.email || 'Not connected'}</p>
                      </div>
                      <Button onClick={handleConnectGoogle} disabled={isLoadingGmailStatus}>
                        {gmailStatus?.connected ? 'Reconnect Google' : 'Connect Google'}
                      </Button>
                    </div>
                    <div className={`flex items-center gap-2 p-2 rounded ${gmailStatus?.connected ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                      {gmailStatus?.connected ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs text-emerald-700 dark:text-emerald-300">Gmail connected</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 text-amber-600" />
                          <span className="text-xs text-amber-700 dark:text-amber-300">Gmail not connected</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <Mail className="w-5 h-5 text-amber-600" />
                  <span className="text-sm text-amber-700 dark:text-amber-300">Switch to node backend mode to enable OAuth integrations</span>
                </div>
              )}

              <AddMailboxDialog
                open={addMailboxOpen}
                onOpenChange={setAddMailboxOpen}
                user={user}
                oauthReturnTo="/Settings"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Branding &amp; White-label
              </CardTitle>
              <CardDescription>
                {isAdmin
                  ? 'Change how this demo looks for each client. Saves to the database — no redeploy needed.'
                  : 'Organization branding is managed by an administrator.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Organization / Company Name</Label>
                  <Input
                    value={brandingForm.companyName || ''}
                    disabled={!isAdmin}
                    onChange={(e) => handleBrandingField('companyName', e.target.value)}
                    className="mt-1.5"
                    placeholder="GovFlow"
                  />
                </div>
                <div>
                  <Label>App Name</Label>
                  <Input
                    value={brandingForm.appName || ''}
                    disabled={!isAdmin}
                    onChange={(e) => handleBrandingField('appName', e.target.value)}
                    className="mt-1.5"
                    placeholder="GovFlow"
                  />
                </div>
                <div>
                  <Label>Sidebar Title</Label>
                  <Input
                    value={brandingForm.sidebarTitle || ''}
                    disabled={!isAdmin}
                    onChange={(e) => handleBrandingField('sidebarTitle', e.target.value)}
                    className="mt-1.5"
                    placeholder="GovFlow"
                  />
                </div>
                <div>
                  <Label>Tagline</Label>
                  <Input
                    value={brandingForm.tagline || ''}
                    disabled={!isAdmin}
                    onChange={(e) => handleBrandingField('tagline', e.target.value)}
                    className="mt-1.5"
                    placeholder="Workflow System"
                  />
                </div>
                <div>
                  <Label>Env Label (login footer)</Label>
                  <Input
                    value={brandingForm.envLabel || ''}
                    disabled={!isAdmin}
                    onChange={(e) => handleBrandingField('envLabel', e.target.value)}
                    className="mt-1.5"
                    placeholder="beta"
                  />
                </div>
                <div>
                  <Label>Support Email</Label>
                  <Input
                    value={brandingForm.supportEmail || ''}
                    disabled={!isAdmin}
                    onChange={(e) => handleBrandingField('supportEmail', e.target.value)}
                    className="mt-1.5"
                    placeholder="support@govflow.local"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Primary Color</Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Input
                      type="color"
                      value={brandingForm.primaryColor || '#2563eb'}
                      disabled={!isAdmin}
                      onChange={(e) => handleBrandingField('primaryColor', e.target.value)}
                      className="h-10 w-14 p-1"
                    />
                    <Input
                      value={brandingForm.primaryColor || ''}
                      disabled={!isAdmin}
                      onChange={(e) => handleBrandingField('primaryColor', e.target.value)}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label>Secondary Color</Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Input
                      type="color"
                      value={brandingForm.secondaryColor || '#0f172a'}
                      disabled={!isAdmin}
                      onChange={(e) => handleBrandingField('secondaryColor', e.target.value)}
                      className="h-10 w-14 p-1"
                    />
                    <Input
                      value={brandingForm.secondaryColor || ''}
                      disabled={!isAdmin}
                      onChange={(e) => handleBrandingField('secondaryColor', e.target.value)}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label>Accent Color</Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Input
                      type="color"
                      value={brandingForm.accentColor || '#6366f1'}
                      disabled={!isAdmin}
                      onChange={(e) => handleBrandingField('accentColor', e.target.value)}
                      className="h-10 w-14 p-1"
                    />
                    <Input
                      value={brandingForm.accentColor || ''}
                      disabled={!isAdmin}
                      onChange={(e) => handleBrandingField('accentColor', e.target.value)}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Logo</Label>
                <div className="flex flex-wrap items-center gap-4">
                  {brandingForm.logoUrl ? (
                    <img
                      src={resolveMediaUrl(brandingForm.logoUrl)}
                      alt="Brand logo"
                      className="h-12 w-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg border border-dashed border-slate-300 dark:border-slate-600" />
                  )}
                  <div className="flex-1 min-w-[200px] space-y-2">
                    <Input
                      value={brandingForm.logoUrl || ''}
                      disabled={!isAdmin}
                      onChange={(e) => handleBrandingField('logoUrl', e.target.value)}
                      placeholder="/logo.svg or https://..."
                    />
                    {isAdmin ? (
                      <label className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-slate-200 dark:border-slate-700 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                          disabled={logoUploading}
                        />
                        {logoUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        Upload logo
                      </label>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show “Powered by GovFlow” credit</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Shown on the login footer</p>
                </div>
                <Switch
                  checked={brandingForm.showGovflowCredit !== false}
                  disabled={!isAdmin}
                  onCheckedChange={(checked) => handleBrandingField('showGovflowCredit', checked)}
                />
              </div>

              {isAdmin ? (
                <div className="pt-2">
                  <Button onClick={handleSaveBranding} disabled={brandingMutation.isPending || !useNodeBackend}>
                    {brandingMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Branding
                  </Button>
                </div>
              ) : null}

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-slate-900 dark:text-slate-100">Language</h4>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="flex-1">
                    English
                  </Button>
                  <Button variant="outline" className="flex-1">
                    العربية
                  </Button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Status labels and UI elements will use both languages
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-slate-900 dark:text-slate-100">Security</h4>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-slate-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-700 dark:text-slate-200">
                        This system uses role-based access control. Contact your administrator
                        to modify user permissions.
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
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

      <ConfirmDeleteDialog
        open={Boolean(mailboxToDelete)}
        onOpenChange={(open) => !open && setMailboxToDelete(null)}
        title="Remove mailbox?"
        description={`Remove ${mailboxToDelete?.email}? The connection will be disconnected. Previously synced emails may remain in the inbox.`}
        confirmLabel="Remove mailbox"
        onConfirm={() => {
          if (mailboxToDelete?.id) {
            deleteMailboxMutation.mutate(mailboxToDelete.id);
          }
          setMailboxToDelete(null);
        }}
        isPending={deleteMailboxMutation.isPending}
      />
    </div>);

}