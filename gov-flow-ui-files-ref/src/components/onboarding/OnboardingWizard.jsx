import React, { useState } from "react";
import { updateMe } from "@/api/authApi";
import {
  listNotificationPreferencesForUser,
  updateNotificationPreference,
  createNotificationPreference,
} from "@/api/notificationPreferencesApi";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  ListTodo,
  Trophy,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  Mail,
  Calendar,
  Users,
} from "lucide-react";
import { ROLES } from "@/components/shared/rbac";
import { canAccessPage } from "@/components/shared/rbac";
import { createPageUrl } from "../../utils";
import { useNavigate } from "react-router-dom";

const ROLE_OPTIONS = [
  { value: ROLES.TEAM_MEMBER, label: "Team Member", desc: "Manage your own tasks and view team info" },
  { value: ROLES.DEPARTMENT_MANAGER, label: "Department Manager", desc: "Manage tasks, team, and view reports" },
  { value: ROLES.DEPARTMENT_ADMIN, label: "Department Admin", desc: "Full department control and analytics" },
  { value: ROLES.ADMIN, label: "System Admin", desc: "Complete system access and configuration" },
];

const FEATURES = [
  {
    icon: ListTodo,
    color: "bg-blue-100 text-blue-600",
    title: "Task Management",
    desc: "Create, assign, and track department initiatives. Filter by status, priority, and team member.",
    page: "Tasks",
  },
  {
    icon: BarChart3,
    color: "bg-violet-100 text-violet-600",
    title: "Performance Dashboard",
    desc: "AI-powered analytics and insights on team productivity across departments and sectors.",
    page: "TeamPerformanceDashboard",
  },
  {
    icon: Trophy,
    color: "bg-amber-100 text-amber-600",
    title: "Leaderboard",
    desc: "See top performers across members, departments, and sectors based on completion metrics.",
    page: "Leaderboard",
  },
  {
    icon: Mail,
    color: "bg-emerald-100 text-emerald-600",
    title: "Email Inbox",
    desc: "Triage incoming emails, convert them to tasks, and manage communication workflows.",
    page: "EmailInbox",
  },
  {
    icon: Calendar,
    color: "bg-rose-100 text-rose-600",
    title: "Calendar View",
    desc: "Visualize your tasks and deadlines on a calendar for better planning.",
    page: "CalendarView",
  },
  {
    icon: Users,
    color: "bg-cyan-100 text-cyan-600",
    title: "Team Directory",
    desc: "Browse team members, departments, and organizational hierarchy.",
    page: "Team",
  },
];

export default function OnboardingWizard({ user, onComplete }) {
  const [step, setStep] = useState(0); // 0=welcome, 1=features, 2=role, 3=notifications, 4=done
  const [notifPrefs, setNotifPrefs] = useState({
    notify_task_assigned: true,
    notify_task_assigned_email: true,
    notify_status_changes: true,
    notify_due_soon: true,
    notify_overdue: true,
    notify_team_performance: false,
  });
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const totalSteps = 5;
  const currentRole = user?.role || ROLES.TEAM_MEMBER;
  const availableFeatures = FEATURES.filter((feature) => canAccessPage(currentRole, feature.page));

  const markOnboardingCompleted = async () => {
    await updateMe({ onboarding_completed: true });
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
  };

  const handleFinish = async () => {
    setSaving(true);
    let completed = false;
    try {
      try {
        const existing = await listNotificationPreferencesForUser(user.id);
        const prefData = { ...notifPrefs, user_id: user.id, user_email: user.email };
        if (existing?.length > 0) {
          await updateNotificationPreference(existing[0].id, prefData);
        } else {
          await createNotificationPreference(prefData);
        }
      } catch (prefError) {
        // Preference save failure should not block onboarding completion.
        console.error(prefError);
      }

      await markOnboardingCompleted();
      completed = true;
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
      if (completed) {
        onComplete();
      }
    }
  };

  const handleSkipOnboarding = async () => {
    setSaving(true);
    try {
      await markOnboardingCompleted();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
      onComplete();
    }
  };

  const handleFeatureClick = async (page) => {
    setSaving(true);
    try {
      await markOnboardingCompleted();
      onComplete();
      navigate(createPageUrl(page));
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    // Step 0 – Welcome
    <div key="welcome" className="flex flex-col items-center text-center gap-6 py-4">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
        <Sparkles className="w-10 h-10 text-white" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Welcome to GovFlow{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}!
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
          Let's take a quick tour of the key features and get your account set up in under 2 minutes.
        </p>
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        {["Task Management", "AI Insights", "Leaderboard", "Email Inbox"].map(tag => (
          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
        ))}
      </div>
    </div>,

    // Step 1 – Features Tour
    <div key="features" className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">What you can do</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Here's a quick overview of the main sections:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {availableFeatures.map(({ icon: Icon, color, title, desc, page }) => (
          <button
            key={page}
            onClick={() => handleFeatureClick(page)}
            className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all text-left group"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">{title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{desc}</p>
            </div>
          </button>
        ))}
      </div>
      {availableFeatures.length === 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-500 dark:text-slate-400">
          No feature shortcuts are available for your role yet. You can still continue and start using your assigned pages.
        </div>
      )}
      <p className="text-xs text-slate-400 text-center pt-1">Only sections available for your role are shown here.</p>
    </div>,

    // Step 2 – Role
    <div key="role" className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your access level</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your account role is managed by administrators. This screen shows your current access.</p>
      </div>
      <div className="space-y-2">
        {ROLE_OPTIONS.map(opt => (
          <div
            key={opt.value}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
              currentRole === opt.value
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-slate-200 dark:border-slate-700 opacity-70"
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
              currentRole === opt.value ? "border-blue-500" : "border-slate-300"
            }`}>
              {currentRole === opt.value && <div className="w-2 h-2 rounded-full bg-blue-500" />}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-white">{opt.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400">Need a different role? Contact your admin from Team Management.</p>
    </div>,

    // Step 3 – Notifications
    <div key="notifications" className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notification preferences</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Choose what you'd like to be notified about. You can change these anytime in Settings.</p>
      </div>
      <div className="space-y-3">
        {[
          { key: "notify_task_assigned", label: "Task assigned to me" },
          { key: "notify_task_assigned_email", label: "Email when task assigned" },
          { key: "notify_status_changes", label: "Task status changes" },
          { key: "notify_due_soon", label: "Tasks due soon" },
          { key: "notify_overdue", label: "Overdue task alerts" },
          { key: "notify_team_performance", label: "Team performance updates" },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <Label htmlFor={key} className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">{label}</Label>
            <Switch
              id={key}
              checked={notifPrefs[key]}
              onCheckedChange={val => setNotifPrefs(prev => ({ ...prev, [key]: val }))}
            />
          </div>
        ))}
      </div>
    </div>,

    // Step 4 – Done
    <div key="done" className="flex flex-col items-center text-center gap-5 py-4">
      <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">You're all set!</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
          Your preferences have been saved. You can explore the full system now.
          <br />
          <span className="text-xs mt-1 block">Tip: Use the sidebar to navigate between sections anytime.</span>
        </p>
      </div>
    </div>,
  ];

  const stepTitles = ["Welcome", "Features", "Your Role", "Notifications", "All Set!"];

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) handleSkipOnboarding(); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0" hideClose>
        {/* Progress bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>

        <div className="p-6 space-y-6">
          {/* Step indicator */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {stepTitles.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i <= step ? "bg-blue-500 w-6" : "bg-slate-200 dark:bg-slate-700 w-3"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-slate-400">{step + 1} / {totalSteps}</span>
          </div>

          {/* Step content */}
          <div className="min-h-[260px]">
            {steps[step]}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => step > 0 ? setStep(s => s - 1) : handleSkipOnboarding()}
              className="text-slate-500"
              disabled={saving}
            >
              {step === 0 ? "Skip" : <><ChevronLeft className="w-4 h-4 mr-1" />Back</>}
            </Button>

            {step < totalSteps - 1 ? (
              <Button
                onClick={() => setStep(s => s + 1)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white gap-1"
              >
                {step === totalSteps - 2 ? "Save & Finish" : "Next"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={saving}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white gap-1"
              >
                {saving ? "Saving…" : "Start Exploring"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}