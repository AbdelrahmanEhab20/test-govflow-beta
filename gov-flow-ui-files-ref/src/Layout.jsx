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
  Mail,
  Calendar,
  Settings,
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Search,
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
import { Input } from "@/components/ui/input";
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
  { name: "Kanban Board", page: "KanbanBoard", icon: ListTodo },
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
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeRole, setActiveRole] = useState(() => {
    const storedRole = localStorage.getItem('activeRole');
    return storedRole ? storedRole : ROLES.ADMIN;
  });
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  useEffect(() => {
    if (user && !activeRole) {
      setActiveRole(user.role);
      localStorage.setItem('activeRole', user.role);
    }
    // Show onboarding for new users who haven't completed it
    if (user && !user.onboarding_completed) {
      setShowOnboarding(true);
    }
  }, [user?.id]);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => listNotificationsForUser(user?.id),
    enabled: !!user?.id,
  });
  const unreadNotifications = (notifications || []).filter((n) => !n.is_read);

  const { data: newEmails = [] } = useQuery({
    queryKey: ['newEmails'],
    queryFn: () => listEmails({ status_in_system: 'new' }, '-received_at', 500),
  });

  const handleLogout = () => {
    authLogout(true);
    localStorage.removeItem('activeRole');
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

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

  const { canAccessPage } = useRbac(activeRole);
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
          --accent: 262 83% 58%;
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">TD</span>
            </div>
            <div>
              <h1 className="font-semibold text-slate-900 dark:text-white text-sm">Tourism Development</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Workflow System</p>
            </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="px-3 space-y-1">
              {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                const Icon = item.icon;
                const hasAccess = canAccessPage(activeRole, item.page);
                
                if (!hasAccess) return null;

                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`
                      sidebar-item flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium
                      ${isActive 
                        ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400' 
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'}
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                    {item.page === 'EmailInbox' && newEmails.length > 0 && (
                      <Badge className="ml-auto bg-red-500 text-white text-xs px-2">
                        {newEmails.length}
                      </Badge>
                    )}
                  </Link>
                );
              })}

              {(canAccessPage(activeRole, 'TeamPerformanceDashboard') || canAccessPage(activeRole, 'DepartmentManagement') || canAccessPage(activeRole, 'RoutingRules')) && (
                <>
                  <div className="pt-4 pb-2 px-4">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Administration
                    </span>
                  </div>
                  {adminItems.map((item) => {
                    const isActive = currentPageName === item.page;
                    const Icon = item.icon;
                    const hasAccess = canAccessPage(activeRole, item.page);
                    
                    if (!hasAccess) return null;

                    return (
                      <Link
                        key={item.page}
                        to={createPageUrl(item.page)}
                        className={`
                          sidebar-item flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium
                          ${isActive 
                            ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400' 
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'}
                        `}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </>
              )}
            </nav>
          </ScrollArea>

          {/* User section */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-700">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-sm">
                      {getInitials(user?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.full_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{activeRole?.replace(/_/g, ' ') || 'User'}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
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
                        className={activeRole === roleOption.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : ''}
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
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 glass-effect">
          <div className="h-full flex items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div className="hidden md:flex relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <Input
                  placeholder="Search tasks, emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-600 text-slate-900 dark:text-white dark:placeholder-slate-400"
                />
              </div>
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