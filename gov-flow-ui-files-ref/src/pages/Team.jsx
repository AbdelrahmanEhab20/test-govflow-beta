import React, { useState } from "react";
import { getCurrentUser } from "@/api/authApi";
import { listUsers, updateUserRole } from "@/api/usersApi";
import { listTasks } from "@/api/tasksApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { 
  Search, 
  Mail,
  ListTodo,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProgressBar from "../components/shared/ProgressBar";
import { ROLES } from "../components/shared/rbac";
import DepartmentOverview from "../components/team/DepartmentOverview";
import TaskCompletionTrends from "../components/team/TaskCompletionTrends";
import AssignTaskDialog from "../components/team/AssignTaskDialog";
import { toast } from "react-hot-toast";

export default function Team() {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }) => updateUserRole(userId, newRole),
    onSuccess: (response, { newRole }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`Role updated to ${getRoleDisplayName(newRole)} successfully`);
    },
    onError: (error) => {
      if (error?.status === 403) {
        toast.error('You do not have permission to assign that role.');
        return;
      }
      toast.error(`Failed to update role: ${error.message}`);
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => listTasks(),
  });

  // Filter users by role scope.
  const currentUserDepartment = currentUser?.department || '';
  const fallbackDepartment = currentUserDepartment || 'Development';
  const isManager = currentUser?.role === 'admin' || currentUser?.role === 'department_manager' || currentUser?.role === 'department_admin';
  
  const filteredUsers = users.filter(user => {
    const userDept = user.department || fallbackDepartment;
    if (currentUser?.role !== 'admin' && currentUserDepartment && userDept !== currentUserDepartment) return false;
    
    // For managers, show direct reports (team members and dept managers if admin)
    if (isManager) {
      if (currentUser?.role === 'admin') {
        // Admin sees all users
      } else if (currentUser?.role === 'department_admin') {
        // Dept admin sees everyone except other admins
        if (user.role === 'admin') return false;
      } else if (currentUser?.role === 'department_manager') {
        // Dept manager sees team members only
        if (user.role !== 'team_member' && user.id !== currentUser?.id) return false;
      }
    }
    
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.department?.toLowerCase().includes(query)
    );
  });

  // Group users by department
  const usersByDepartment = filteredUsers.reduce((acc, user) => {
    const dept = user.department || fallbackDepartment;
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(user);
    return acc;
  }, {});

  const departments = Object.keys(usersByDepartment).sort();

  const getUserStats = (userId) => {
    const userTasks = tasks.filter(t => t.lead_user_id === userId);
    const total = userTasks.length;
    const completed = userTasks.filter(t => t.status === 'completed').length;
    const inProgress = userTasks.filter(t => t.status === 'in_progress').length;
    const overdue = userTasks.filter(t => 
      t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
    ).length;
    const avgCompletion = total > 0
      ? Math.round(userTasks.reduce((sum, t) => sum + (t.completion_percent || 0), 0) / total)
      : 0;

    return { total, completed, inProgress, overdue, avgCompletion };
  };

  const getInitials = (name) => {
    if (!name) return "?";
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

  const getUserAvatarUrl = (user) => {
    const raw = user?.avatar_url || user?.avatar || user?.photo_url || user?.image_url || user?.profile_image || "";
    return resolveMediaUrl(raw);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
      case 'department_admin': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300';
      case 'department_manager': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      case 'team_member': return 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'department_admin': return 'Dept Admin';
      case 'department_manager': return 'Dept Manager';
      case 'team_member': return 'Team Member';
      case 'user': return 'User';
      default: return role || 'user';
    }
  };

  const handleRoleChange = (userId, newRole) => {
    updateRoleMutation.mutate({ userId, newRole });
  };

  const canChangeRole = currentUser?.role === 'admin' || currentUser?.role === 'department_admin';

  const getAssignableRoles = () => {
    if (currentUser?.role === 'admin') {
      return [ROLES.ADMIN, ROLES.DEPARTMENT_ADMIN, ROLES.DEPARTMENT_MANAGER, ROLES.TEAM_MEMBER, ROLES.USER];
    }
    if (currentUser?.role === 'department_admin') {
      return [ROLES.DEPARTMENT_MANAGER, ROLES.TEAM_MEMBER, ROLES.USER];
    }
    return [];
  };

  const getAssignableRolesForUser = (targetUser) => {
    const allowedRoles = getAssignableRoles();
    if (!targetUser) return allowedRoles;
    if (currentUser?.role === 'department_admin') {
      if (targetUser.role === ROLES.ADMIN) return [];
      if ((targetUser.department || fallbackDepartment) !== currentUserDepartment) return [];
    }
    if (targetUser.id === currentUser?.id && currentUser?.role !== 'admin') {
      // Avoid accidental self-demotion for non-admin actors.
      return [];
    }
    return allowedRoles;
  };

  return (
    <div className="p-3 sm:p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Team</h1>
      <p className="text-slate-500 dark:text-slate-400 mt-1">{(currentUserDepartment || fallbackDepartment)} members and workload</p>
        </div>
        
        <div className="relative flex-1 sm:flex-none sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
          />
        </div>
      </div>

      {/* Task Completion Trends */}
      <TaskCompletionTrends tasks={tasks} />

      {/* Department Sections */}
      {departments.map(dept => (
        <div key={dept}>
          <DepartmentOverview 
            department={dept} 
            users={usersByDepartment[dept]} 
            tasks={tasks}
          />

          {/* Team Grid for Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-5 mb-8">
            {usersByDepartment[dept].map(user => {
              const stats = getUserStats(user.id);
              
              return (
                <Card
                  key={user.id}
                  className="group overflow-hidden border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 dark:bg-slate-900 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur"
                >
                  <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-3 sm:px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-white/80 shadow-sm">
                        <AvatarImage src={getUserAvatarUrl(user)} />
                        <AvatarFallback className="bg-blue-500 text-white text-base">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base sm:text-lg text-white truncate">{user.full_name}</h3>
                        {user.position && (
                          <p className="text-xs sm:text-sm text-white/90 font-medium truncate">{user.position}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <CardContent className="pb-4 sm:pb-5 px-3 sm:px-5 pt-3 sm:pt-4">
                    {canChangeRole ? (
                          <Select
                            value={user.role || 'team_member'}
                            onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                            disabled={getAssignableRolesForUser(user).length === 0}
                          >
                            <SelectTrigger className="w-[150px] sm:w-[165px] h-8 mt-2 dark:bg-slate-800 dark:border-slate-600">
                              <Shield className="w-3 h-3 mr-1" />
                              <SelectValue placeholder="Select role">
                                {getRoleDisplayName(user.role)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {getAssignableRolesForUser(user).map((roleValue) => (
                                <SelectItem key={roleValue} value={roleValue}>
                                  {getRoleDisplayName(roleValue)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={getRoleBadgeColor(user.role)} variant="secondary">
                            {getRoleDisplayName(user.role)}
                          </Badge>
                        )}

                    <div className="mt-3 sm:mt-4 space-y-1.5 border-t border-slate-100 dark:border-slate-700 pt-3">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {user.department || fallbackDepartment}
                      </p>
                      
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 min-w-0">
                        <a href={`mailto:${user.email}`} className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </a>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-3 sm:mt-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 p-3">
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="rounded-lg bg-white/80 dark:bg-slate-900/40 p-1.5">
                          <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">{stats.total}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Tasks</p>
                        </div>
                        <div className="rounded-lg bg-white/80 dark:bg-slate-900/40 p-1.5">
                          <p className="text-base sm:text-lg font-semibold text-emerald-600 dark:text-emerald-400">{stats.completed}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Done</p>
                        </div>
                        <div className="rounded-lg bg-white/80 dark:bg-slate-900/40 p-1.5">
                          <p className="text-base sm:text-lg font-semibold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Active</p>
                        </div>
                        <div className="rounded-lg bg-white/80 dark:bg-slate-900/40 p-1.5">
                          <p className="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400">{stats.overdue}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Overdue</p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                          <span>Avg Completion</span>
                          <span>{stats.avgCompletion}%</span>
                        </div>
                        <ProgressBar value={stats.avgCompletion} showLabel={false} size="sm" />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 sm:mt-4 flex gap-2">
                      <Link to={createPageUrl(`Tasks?lead=${user.id}`)} className="flex-1">
                        <Button
                          variant="outline"
                          className="w-full dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                          size="sm"
                        >
                          <ListTodo className="w-4 h-4 mr-1" />
                          View Tasks
                        </Button>
                      </Link>
                    </div>
                    {isManager && user.id !== currentUser?.id && (
                      <div className="mt-2">
                        <AssignTaskDialog targetUser={user} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No team members found</p>
        </div>
      )}
    </div>
  );
}