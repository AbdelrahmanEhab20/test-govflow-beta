import React, { useState } from "react";
import { listUsers, updateUser } from "@/api/usersApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2, Loader2 } from "lucide-react";

export default function DepartmentMembers({ departmentId }) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['departmentMembers', departmentId],
    queryFn: async () => {
      if (!departmentId) return [];
      const allUsers = await listUsers();
      return allUsers.filter(u => u.department_id === departmentId);
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (userId) => {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      await updateUser(userId, { department_id: departmentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departmentMembers'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSelectedUserId('');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId) => {
      await updateUser(userId, { department_id: '', department: '' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departmentMembers'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Users not yet in this department
  const availableUsers = users.filter(u => !u.department_id || u.department_id !== departmentId);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Department Members ({members.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Member */}
        <div className="flex gap-2">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select user to add..." />
            </SelectTrigger>
            <SelectContent>
              {availableUsers.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name} ({user.position})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => addMemberMutation.mutate(selectedUserId)}
            disabled={!selectedUserId || addMemberMutation.isPending}
            className="gap-2"
          >
            {addMemberMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            Add
          </Button>
        </div>

        {/* Members List */}
        {members.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No members assigned yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map(member => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={resolveMediaUrl(member.avatar_url || member.avatar || member.photo_url || member.image_url || member.profile_image)} />
                    <AvatarFallback className="bg-blue-500 text-white">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {member.full_name}
                    </p>
                    <p className="text-sm text-slate-500 truncate">
                      {member.position}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeMemberMutation.mutate(member.id)}
                  disabled={removeMemberMutation.isPending}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}