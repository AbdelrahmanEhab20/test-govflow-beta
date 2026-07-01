import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Phone, X, Plus, Search } from "lucide-react";
import { updateUser } from "@/api/usersApi";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

function memberBelongsToDepartment(member, departmentId, departmentName) {
  if (departmentId && member.department_id === departmentId) return true;
  if (departmentName && member.department_name === departmentName) return true;
  return false;
}

export default function DepartmentMembersManager({
  departmentId,
  departmentName,
  teamMembers = [],
  onMembersUpdate,
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const currentMembers = useMemo(
    () => teamMembers.filter((member) => memberBelongsToDepartment(member, departmentId, departmentName)),
    [teamMembers, departmentId, departmentName],
  );

  const availableMembers = useMemo(
    () =>
      teamMembers.filter(
        (member) =>
          !memberBelongsToDepartment(member, departmentId, departmentName) &&
          (searchQuery === '' ||
            member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchQuery.toLowerCase())),
      ),
    [teamMembers, departmentId, departmentName, searchQuery],
  );

  const invalidateMemberQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['users'] }),
      queryClient.invalidateQueries({ queryKey: ['departments'] }),
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] }),
    ]);
    onMembersUpdate?.();
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

  const handleAddMember = (memberId) => {
    setSelectedToAdd([...selectedToAdd, memberId]);
  };

  const handleRemoveMember = (memberId) => {
    setSelectedToAdd(selectedToAdd.filter(id => id !== memberId));
  };

  const handleRemoveCurrentMember = async (memberId) => {
    try {
      setIsSaving(true);
      await updateUser(memberId, { department_id: '', department: '' });
      await invalidateMemberQueries();
      toast({
        title: 'Member removed',
        description: 'User was unassigned from this department.',
      });
    } catch (error) {
      toast({
        title: 'Could not remove member',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNewMembers = async () => {
    if (selectedToAdd.length === 0 || !departmentId) return;

    try {
      setIsSaving(true);
      const count = selectedToAdd.length;
      for (const memberId of selectedToAdd) {
        await updateUser(memberId, {
          department_id: departmentId,
          department: departmentName,
        });
      }
      await invalidateMemberQueries();
      setSelectedToAdd([]);
      toast({
        title: 'Members added',
        description: `${count} member${count !== 1 ? 's' : ''} assigned to ${departmentName}.`,
      });
    } catch (error) {
      toast({
        title: 'Could not add members',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
          Current Members ({currentMembers.length})
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {currentMembers.length === 0 ? (
            <p className="text-sm text-slate-500">No members assigned yet</p>
          ) : (
            currentMembers.map(member => (
              <Card key={member.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={resolveMediaUrl(member.avatar_url || member.avatar || member.photo_url || member.image_url || member.profile_image) || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{member.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{member.job_title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {member.email && (
                    <a href={`mailto:${member.email}`} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                  {member.mobile_number && (
                    <a href={`tel:${member.mobile_number}`} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => handleRemoveCurrentMember(member.id)}
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Add Members</h4>

        <div className="relative mb-3 isolate">
          <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, title, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-3">
          {availableMembers.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              {searchQuery ? 'No matching members found' : 'All members already assigned'}
            </p>
          ) : (
            availableMembers.map(member => {
              const isSelected = selectedToAdd.includes(member.id);
              return (
                <Card
                  key={member.id}
                  className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={resolveMediaUrl(member.avatar_url || member.avatar || member.photo_url || member.image_url || member.profile_image) || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-500 text-white text-xs">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{member.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{member.job_title}</p>
                    </div>
                  </div>
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="ml-2"
                    onClick={() => isSelected ? handleRemoveMember(member.id) : handleAddMember(member.id)}
                  >
                    {isSelected ? (
                      <>
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </Card>
              );
            })
          )}
        </div>

        {selectedToAdd.length > 0 && (
          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleSaveNewMembers}
              disabled={isSaving || !departmentId}
              className="gap-2"
            >
              {isSaving ? 'Saving...' : `Add ${selectedToAdd.length} Member${selectedToAdd.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
