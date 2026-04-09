import React, { useState, useEffect } from "react";
import { getCurrentUser, updateMe, uploadAvatar } from "@/api/authApi";
import { listUsers, updateUser } from "@/api/usersApi";
import { listDepartments } from "@/api/departmentsApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Save, 
  Camera,
  Loader2,
  Mail,
  Phone,
  Building,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(),
    enabled: user?.role === 'admin',
  });
  const { data: departments = [] } = useQuery({
    queryKey: ['databaseDepartments'],
    queryFn: () => listDepartments(),
  });

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    full_name_ar: '',
    phone: '',
    department: '',
    position: ''
  });
  const [avatarLoading, setAvatarLoading] = useState(false);
  const isAdminEditingOther = user?.role === 'admin' && Boolean(selectedUserId);

  useEffect(() => {
    const targetUser = selectedUserId && user?.role === 'admin' 
      ? users.find(u => u.id === selectedUserId) 
      : user;
    
    if (targetUser) {
      setEditingUser(targetUser);
      setFormData({
        full_name: targetUser.full_name || '',
        full_name_ar: targetUser.full_name_ar || '',
        phone: targetUser.phone || '',
        department: targetUser.department || '',
        position: targetUser.position || ''
      });
    }
  }, [user, selectedUserId, users]);

  const updateMutation = useMutation({
    mutationFn: (data) => updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    },
  });

  const updateOtherUserMutation = useMutation({
    mutationFn: (data) => updateUser(selectedUserId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Profile updated",
        description: "User profile has been saved successfully.",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedUserId && user?.role === 'admin') {
      updateOtherUserMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  };

  const handlePhotoUpload = async (e) => {
    if (isAdminEditingOther) {
      toast({
        title: "Avatar upload disabled",
        description: "Admins can upload only their own profile avatar.",
      });
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarLoading(true);
    try {
      await uploadAvatar(file);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast({
        title: "Photo updated",
        description: "Your profile photo has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAvatarLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const resolveAvatarUrl = (avatarUrl) => {
    if (!avatarUrl) return "";
    if (/^https?:\/\//i.test(avatarUrl)) return avatarUrl;
    if (avatarUrl.startsWith('/')) {
      const apiBase = import.meta.env.VITE_API_BASE_URL;
      if (!apiBase) return avatarUrl;
      try {
        return new URL(avatarUrl, apiBase).toString();
      } catch {
        return avatarUrl;
      }
    }
    return avatarUrl;
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your account information</p>
      </div>

      {/* Admin User Selector */}
      {user?.role === 'admin' && (
        <Card className="mb-6 dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-4">
            <Label className="dark:text-slate-200 block mb-2">Edit User Profile</Label>
            <Select value={selectedUserId || '__self__'} onValueChange={(value) => setSelectedUserId(value === '__self__' ? null : value)}>
              <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                <SelectValue placeholder="Select user (or manage your own)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__self__">Your Profile</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.full_name} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Profile Header */}
      <Card className="mb-6 overflow-hidden border-0 shadow-lg dark:shadow-xl dark:bg-slate-800 dark:border-slate-700">
        <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        <CardContent className="p-6 -mt-16 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-white dark:border-slate-900 shadow-lg">
                <AvatarImage src={resolveAvatarUrl(editingUser?.avatar_url)} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-4xl font-bold">
                  {getInitials(editingUser?.full_name)}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 w-10 h-10 bg-white dark:bg-slate-800 rounded-full border-2 border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer group">
                {avatarLoading ? (
                  <Loader2 className="w-5 h-5 text-slate-600 dark:text-slate-300 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={avatarLoading}
                  className="hidden"
                  aria-label="Upload profile photo"
                />
              </label>
            </div>
            <div className="flex-1 pb-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{editingUser?.full_name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {editingUser?.email}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Badge className="capitalize bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
                  {editingUser?.role || 'user'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card className="dark:border-slate-700 dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="dark:text-white">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="dark:text-slate-200">Full Name (English)</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="mt-1.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{isAdminEditingOther ? 'Editing selected user' : 'Editing your profile'}</p>
              </div>

              <div>
                <Label className="dark:text-slate-200">Full Name (Arabic)</Label>
                <Input
                  value={formData.full_name_ar}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name_ar: e.target.value }))}
                  placeholder="الاسم بالعربية"
                  className="mt-1.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  dir="rtl"
                />
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2 dark:text-slate-200">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                value={editingUser?.email || ''}
                disabled
                className="mt-1.5 bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white disabled:dark:text-slate-400"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cannot be changed</p>
            </div>

            <div>
              <Label className="flex items-center gap-2 dark:text-slate-200">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+966 XX XXX XXXX"
                className="mt-1.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2 dark:text-slate-200">
                  <Building className="w-4 h-4" />
                  Department
                </Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                >
                  <SelectTrigger className="mt-1.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
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

              <div>
                <Label className="flex items-center gap-2 dark:text-slate-200">
                  <Briefcase className="w-4 h-4" />
                  Position
                </Label>
                <Input
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="e.g., Senior Analyst"
                  className="mt-1.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={updateMutation.isPending || updateOtherUserMutation.isPending}>
                {(updateMutation.isPending || updateOtherUserMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}