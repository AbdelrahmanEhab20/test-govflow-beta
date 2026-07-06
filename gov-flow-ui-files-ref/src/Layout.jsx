import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/api/authApi";
import { listEmails } from "@/api/emailApi";
import { listNotificationsForUser } from "@/api/notificationsApi";
import {
  LayoutDashboard,
  ListTodo,
  Kanban,
  Mail,
  Calendar,
  Settings,
  Bell,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  LogOut,
  User,
  BarChart3,
  Users,
  Route,
  Info,
  Trophy,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DarkModeToggle from "@/components/shared/DarkModeToggle";
import { ROLES } from "./components/shared/rbac";
import { useRbac } from "@/components/shared/useRbac";
import NotificationCenter from "@/components/shared/NotificationCenter";
import AssignmentToastListener from "@/components/shared/AssignmentToastListener";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { useAuth } from "@/lib/AuthContext";

const STATUS_LABELS = {
  not_started: { en: "Not Started", ar: "لم يبدأ" },
  in_progress: { en: "In Progress", ar: "قيد التنفيذ" },
  completed: { en: "Completed", ar: "مكتمل" },
  on_hold: { en: "On Hold", ar: "مؤجل" },
  delayed: { en: "Delayed", ar: "متأخر" }
};

const navItems = [
  { name: "About GovFlow", page: "AboutGovFlow", icon: Info },
  { name: "My Dashboard", page: "MyDashboard", icon: LayoutDashboard },
  { name: "Tasks", page: "Tasks", icon: ListTodo },
  { name: "Kanban Board", page: "KanbanBoard", icon: Kanban },
  { name: "Email Inbox", page: "EmailInbox", icon: Mail },
  { name: "Calendar", page: "CalendarView", icon: Calendar },
  { name: "Reports", page: "Reports", icon: BarChart3 },
  { name: "Team", page: "Team", icon: Users },
];

const adminItems = [
  { name: "Team Performance", page: "TeamPerformanceDashboard", icon: BarChart3 },
  { name: "Leaderboard", page: "Leaderboard", icon: Trophy },
  { name: "Team Management", page: "DepartmentManagement", icon: Users },
  { name: "Workflow Stages", page: "WorkflowStageManagement", icon: Route },
  { name: "Routing Rules", page: "RoutingRules", icon: Route },
  { name: "Settings", page: "Settings", icon: Settings },
  { name: "Access Control", page: "AccessControl", icon: Shield },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(() => {
    try {
      return localStorage.getItem('desktopSidebarOpen') !== 'false';
    } catch {
      return true;
    }
  });
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeRole, setActiveRole] = useState(null);
  const navigate = useNavigate();
  const { logout: authLogout, appPublicSettings } = useAuth();
  const branding = appPublicSettings?.public_settings || {};
  const appName = branding.appName || 'GovFlow';
  const companyName = branding.companyName || appName;
  const sidebarTitle = branding.sidebarTitle || companyName;
  const tagline = branding.tagline || appName;
  const logoUrl = branding.logoUrl || '';
  const companyInitials = companyName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'GV';

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const getAvailableSwitchRoles = (actualRole) => {
    if (!actualRole) return [];
    const roles = [
      { label: 'Admin View', value: ROLES.ADMIN },
      { label: 'Department Admin View', value: ROLES.DEPARTMENT_ADMIN },
      { label: 'Department Manager View', value: ROLES.DEPARTMENT_MANAGER },
      { label: 'Team Member View', value: ROLES.TEAM_MEMBER },
    ];

    if (actualRole === ROLES.ADMIN) {
      return roles;
    } else if (actualRole === ROLES.DEPARTMENT_ADMIN) {
      return roles.filter(role =>
        [ROLES.DEPARTMENT_ADMIN, ROLES.DEPARTMENT_MANAGER, ROLES.TEAM_MEMBER].includes(role.value)
      );
    } else if (actualRole === ROLES.DEPARTMENT_MANAGER) {
      return roles.filter(role =>
        [ROLES.DEPARTMENT_MANAGER, ROLES.TEAM_MEMBER].includes(role.value)
      );
    }
    return [];
  };

  useEffect(() => {
    if (user?.role) {
      const storedRole = localStorage.getItem('activeRole');
      const switchableRoles = getAvailableSwitchRoles(user.role).map((roleOption) => roleOption.value);
      const canUseStoredRole = storedRole && (storedRole === user.role || switchableRoles.includes(storedRole));
      const nextRole = canUseStoredRole ? storedRole : user.role;
      if (activeRole !== nextRole) {
        setActiveRole(nextRole);
      }
      localStorage.setItem('activeRole', nextRole);
    }

    // Show onboarding for new users who haven't completed it
    if (user && !user.onboarding_completed) {
      setShowOnboarding(true);
    }
  }, [user?.id, user?.role, user?.onboarding_completed, activeRole]);

  useEffect(() => {
    try {
      localStorage.setItem('desktopSidebarOpen', String(desktopSidebarOpen));
    } catch {
      // Ignore storage access issues.
    }
  }, [desktopSidebarOpen]);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => listNotificationsForUser(user?.id),
    enabled: !!user?.id,
  });
  const unreadNotifications = (notifications || []).filter((n) => !n.is_read);

  const { data: newEmails = [] } = useQuery({
    queryKey: ['newEmails', user?.mailboxes],
    queryFn: () => {
      const activeMailbox = user?.mailboxes?.find((mailbox) => mailbox.isActive)?.email;
      const query = {
        status_in_system: 'new',
        ...(activeMailbox ? { mailbox: activeMailbox } : {}),
      };
      return listEmails(query, '-received_at', 500);
    },
    enabled: !!user,
  });

  const handleLogout = () => {
    authLogout(true);
    localStorage.removeItem('activeRole');
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const resolveMediaUrl = (url) => {
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
  };

  const effectiveRole = activeRole || user?.role || null;
  const { canAccessPage } = useRbac(effectiveRole);
  const availableSwitchRoles = getAvailableSwitchRoles(user?.role);

  const handleRoleSwitch = (role) => {
    setActiveRole(role);
    localStorage.setItem('activeRole', role);
    navigate(createPageUrl('Tasks'));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AssignmentToastListener />
      <style>{`
        :root {
          --primary: 220 90% 56%;
          --primary-foreground: 0 0% 100%;
          --accent: 220 90% 56%;
          --accent-foreground: 0 0% 100%;
        }
        .sidebar-item {
          transition: all 0.2s ease;
        }
        .sidebar-item:hover {
          transform: translateX(4px);
        }
        .glass-effect {
          backdrop-filter: blur(12px);
          background: rgba(255, 255, 255, 0.8);
        }
        .dark .glass-effect {
          background: rgba(15, 23, 42, 0.9);
        }
      `}</style>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
        transform transition-transform duration-300 ease-in-out
        w-72 ${desktopSidebarOpen ? 'md:w-72' : 'md:w-20'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`h-16 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 ${desktopSidebarOpen ? 'px-6' : 'px-3 md:px-4'}`}>
            <div className={`flex items-center gap-3 ${desktopSidebarOpen ? '' : 'md:justify-center md:w-full'}`}>
            {logoUrl ? (
              <img
                src={resolveMediaUrl(logoUrl)}
                alt={`${companyName} logo`}
                className="w-10 h-10 rounded-xl object-cover border border-slate-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{companyInitials}</span>
              </div>
            )}
            <div className={`${desktopSidebarOpen ? 'block' : 'hidden'}`}>
              <h1 className="font-semibold text-slate-900 dark:text-white text-sm">{sidebarTitle}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{tagline}</p>
            </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className={`space-y-1 ${desktopSidebarOpen ? 'px-3' : 'px-2'}`}>
              {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                const Icon = item.icon;
                const hasAccess = canAccessPage(effectiveRole, item.page);
                
                if (!hasAccess) return null;

                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    title={!desktopSidebarOpen ? item.name : undefined}
                    className={`
                      sidebar-item flex items-center rounded-lg text-sm font-medium
                      ${desktopSidebarOpen ? 'gap-3 px-4 py-2.5' : 'justify-center px-2 py-2.5'}
                      ${isActive 
                        ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400' 
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'}
                    `}
                  >
                    <span className="relative inline-flex">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      {!desktopSidebarOpen && item.page === 'EmailInbox' && newEmails.length > 0 && (
                        <span className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
                      )}
                    </span>
                    {desktopSidebarOpen && <span>{item.name}</span>}
                    {item.page === 'EmailInbox' && newEmails.length > 0 && (
                      desktopSidebarOpen ? (
                        <Badge className="ml-auto bg-red-500 text-white text-xs px-2">
                          {newEmails.length}
                        </Badge>
                      ) : null
                    )}
                  </Link>
                );
              })}

              {(canAccessPage(effectiveRole, 'TeamPerformanceDashboard') || canAccessPage(effectiveRole, 'DepartmentManagement') || canAccessPage(effectiveRole, 'RoutingRules')) && (
                <>
                  <div className={`pt-4 pb-2 ${desktopSidebarOpen ? 'px-4' : 'px-2'}`}>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {desktopSidebarOpen ? 'Administration' : 'Adm'}
                    </span>
                  </div>
                  {adminItems.map((item) => {
                    const isActive = currentPageName === item.page;
                    const Icon = item.icon;
                    const hasAccess = canAccessPage(effectiveRole, item.page);
                    
                    if (!hasAccess) return null;

                    return (
                      <Link
                        key={item.page}
                        to={createPageUrl(item.page)}
                        title={!desktopSidebarOpen ? item.name : undefined}
                        className={`
                          sidebar-item flex items-center rounded-lg text-sm font-medium
                          ${desktopSidebarOpen ? 'gap-3 px-4 py-2.5' : 'justify-center px-2 py-2.5'}
                          ${isActive 
                            ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400' 
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'}
                        `}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                        {desktopSidebarOpen && <span>{item.name}</span>}
                      </Link>
                    );
                  })}
                </>
              )}
            </nav>
          </ScrollArea>

          {/* User section */}
          <div className={`border-t border-slate-100 dark:border-slate-700 ${desktopSidebarOpen ? 'p-4' : 'p-2 md:p-3'}`}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button title={!desktopSidebarOpen ? (user?.full_name || 'User') : undefined} className={`w-full flex items-center rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${desktopSidebarOpen ? 'gap-3 p-2' : 'justify-center p-2'}`}>
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={resolveMediaUrl(user?.avatar_url)} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-sm">
                      {getInitials(user?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  {desktopSidebarOpen && (
                    <>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.full_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{effectiveRole?.replace(/_/g, ' ') || 'User'}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate(createPageUrl('Profile'))}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(createPageUrl('Settings'))}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                {availableSwitchRoles.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">Switch Role</div>
                    {availableSwitchRoles.map((roleOption) => (
                      <DropdownMenuItem
                        key={roleOption.value}
                        onClick={() => handleRoleSwitch(roleOption.value)}
                        className={effectiveRole === roleOption.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : ''}
                      >
                        {roleOption.label}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`${desktopSidebarOpen ? 'md:pl-72' : 'md:pl-20'} transition-all duration-300`}>
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 glass-effect">
          <div className="h-full flex items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex"
                onClick={() => setDesktopSidebarOpen((open) => !open)}
                aria-label={desktopSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                title={desktopSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {desktopSidebarOpen ? (
                  <PanelLeftClose className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                ) : (
                  <PanelLeftOpen className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <DarkModeToggle />
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
              >
                <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotifications.length}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>

      {/* Notification Center Panel */}
      <NotificationCenter isOpen={notificationPanelOpen} onClose={() => setNotificationPanelOpen(false)} />

      {/* Onboarding Wizard */}
      {showOnboarding && user && (
        <OnboardingWizard user={user} onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}