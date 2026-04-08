import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listUsers, updateUserRole } from "@/api/usersApi";
import { ROLES } from "@/components/shared/rbac";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
        <div className="space-y-2">
          {filtered.map(user => (
            <div key={user.id} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-sm">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white truncate">{user.full_name || "—"}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge className={`text-xs border ${ROLE_COLORS[user.role] || ROLE_COLORS.user}`}>
                  {ROLE_LABELS[user.role] || user.role}
                </Badge>
                <Select
                  value={user.role || "user"}
                  onValueChange={role => updateRoleMutation.mutate({ userId: user.id, role })}
                >
                  <SelectTrigger className="w-44 h-8 text-sm">
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