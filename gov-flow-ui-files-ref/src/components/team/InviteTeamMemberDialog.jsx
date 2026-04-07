import React, { useState } from "react";
import { inviteUser } from "@/api/usersApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

export default function InviteTeamMemberDialog({ departments }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'user',
    department: '',
    position: ''
  });
  const [newDepartment, setNewDepartment] = useState('');
  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: async (data) => {
      await inviteUser(data.email, data.role);
      // Update user with department and position
      if (data.department || data.position) {
        // This will be updated when the user registers
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setFormData({ email: '', role: 'user', department: '', position: '' });
      setNewDepartment('');
      setOpen(false);
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
      department: newDepartment || formData.department,
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
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
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
                  setNewDepartment('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department or create new" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id || dept.name} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <span className="text-xs text-slate-500">Or create new:</span>
              </div>
              <Input
                type="text"
                value={newDepartment}
                onChange={(e) => {
                  setNewDepartment(e.target.value);
                  setFormData(prev => ({ ...prev, department: '' }));
                }}
                placeholder="New department name"
              />
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