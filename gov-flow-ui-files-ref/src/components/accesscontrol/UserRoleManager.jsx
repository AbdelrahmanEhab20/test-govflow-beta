import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listUsers, updateUserRole } from "@/api/usersApi";
import { ROLES } from "@/components/shared/rbac";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Shield } from "lucide-react";
import { toast } from "react-hot-toast";

const ROLE_LABELS = {
  admin: "System Admin",
  department_admin: "Department Admin",
  department_manager: "Department Manager",
  team_member: "Team Member",
  editor: "Editor",
  viewer: "Viewer",
  user: "User",
};

const ROLE_COLORS = {
  admin: "bg-red-100 text-red-700 border-red-200",
  department_admin: "bg-purple-100 text-purple-700 border-purple-200",
  department_manager: "bg-blue-100 text-blue-700 border-blue-200",
  team_member: "bg-green-100 text-green-700 border-green-200",
  editor: "bg-yellow-100 text-yellow-700 border-yellow-200",
  viewer: "bg-slate-100 text-slate-700 border-slate-200",
  user: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function UserRoleManager() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => listUsers(),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User role updated successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update user role");
    },
  });

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

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

  const getUserAvatarUrl = (user) =>
    resolveMediaUrl(user?.avatar_url || user?.avatar || user?.photo_url || user?.image_url || user?.profile_image || "");

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search users by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(user => (
            <div
              key={user.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <Avatar className="w-11 h-11 shrink-0">
                <AvatarImage src={getUserAvatarUrl(user)} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-sm">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{user.full_name || "—"}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{user.email}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {user.department && (
                    <Badge variant="outline" className="text-[11px] font-normal">
                      {user.department}
                    </Badge>
                  )}
                  {user.position && (
                    <Badge variant="outline" className="text-[11px] font-normal">
                      {user.position}
                    </Badge>
                  )}
                  {!user.department && !user.position && (
                    <span className="text-xs text-slate-400">No additional profile details</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <Badge className={`text-xs border font-medium ${ROLE_COLORS[user.role] || ROLE_COLORS.user}`}>
                  {ROLE_LABELS[user.role] || user.role}
                </Badge>
                <Select
                  value={user.role || "user"}
                  onValueChange={role => updateRoleMutation.mutate({ userId: user.id, role })}
                >
                  <SelectTrigger className="w-full sm:w-48 h-9 text-sm bg-white dark:bg-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No users found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}