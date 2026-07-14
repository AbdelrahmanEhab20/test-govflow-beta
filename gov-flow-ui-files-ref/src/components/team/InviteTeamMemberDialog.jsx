import React, { useState } from "react";
import { inviteUser } from "@/api/usersApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";
import { hasPermission, PERMISSIONS } from "@/components/shared/rbac";

const BASE_ROLE_OPTIONS = [
  { value: "user", label: "User" },
  { value: "team_member", label: "Team Member" },
  { value: "department_manager", label: "Department Manager" },
  { value: "department_admin", label: "Department Admin" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

export default function InviteTeamMemberDialog({ departments, currentUser }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'user',
    department: '',
    position: ''
  });
  const queryClient = useQueryClient();

  const canInviteAdmin = currentUser?.role === 'admin';
  const roleOptions = canInviteAdmin
    ? [...BASE_ROLE_OPTIONS, { value: "admin", label: "Admin" }]
    : BASE_ROLE_OPTIONS;

  if (!hasPermission(currentUser?.role, PERMISSIONS.USERS_INVITE)) {
    return null;
  }

  const inviteMutation = useMutation({
    mutationFn: async (data) => {
      return inviteUser({
        email: data.email,
        role: data.role,
        ...(data.department ? { department: data.department } : {}),
        ...(data.position ? { position: data.position } : {}),
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      const isResend = Boolean(response?.isResend);
      const queued = Boolean(response?.deliveryStatus?.messageQueued);
      if (queued && isResend) {
        toast.success('Invite resent successfully');
      } else if (queued) {
        toast.success('Invite queued and email sent');
      } else {
        toast.success('Invite saved');
      }
      setFormData({ email: '', role: 'user', department: '', position: '' });
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error?.message || 'Invite failed. Please retry.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email) {
      alert('Please enter an email address');
      return;
    }
    inviteMutation.mutate({
      email: formData.email,
      role: formData.role,
      department: formData.department,
      position: formData.position
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" />
          Invite Team Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="member@example.com"
              className="mt-1.5"
              required
            />
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="department">Department</Label>
            <div className="space-y-2 mt-1.5">
              <Select
                value={formData.department}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, department: value }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id || dept.name} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              placeholder="e.g., Manager, Developer"
              className="mt-1.5"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Invite
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
