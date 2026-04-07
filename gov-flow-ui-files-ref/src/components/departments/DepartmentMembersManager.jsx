import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Phone, X, Plus, Search } from "lucide-react";
import { updateTeam } from "@/api/departmentsApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function DepartmentMembersManager({ 
  departmentName, 
  teamMembers = [],
  onMembersUpdate 
}) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const currentMembers = useMemo(() => 
    teamMembers.filter(m => m.department_name === departmentName),
    [teamMembers, departmentName]
  );

  const availableMembers = useMemo(() => 
    teamMembers.filter(m => 
      m.department_name !== departmentName &&
      (searchQuery === '' || 
        m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    [teamMembers, departmentName, searchQuery]
  );

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleAddMember = (memberId) => {
    setSelectedToAdd([...selectedToAdd, memberId]);
  };

  const handleRemoveMember = (memberId) => {
    setSelectedToAdd(selectedToAdd.filter(id => id !== memberId));
  };

  const handleRemoveCurrentMember = async (memberId) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return;

    try {
      setIsSaving(true);
      await updateTeam(memberId, {
        department_name: ''
      });
      await queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      onMembersUpdate?.();
    } catch (error) {
      console.error('Error removing member:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNewMembers = async () => {
    if (selectedToAdd.length === 0) return;

    try {
      setIsSaving(true);
      for (const memberId of selectedToAdd) {
        await updateTeam(memberId, {
          department_name: departmentName
        });
      }
      await queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      setSelectedToAdd([]);
      onMembersUpdate?.();
    } catch (error) {
      console.error('Error adding members:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Members */}
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
                    <AvatarImage src={member.avatar_url} />
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

      {/* Add Members Section */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Add Members</h4>
        
        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, title, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Available Members List */}
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
                      <AvatarImage src={member.avatar_url} />
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

        {/* Save Button */}
        {selectedToAdd.length > 0 && (
          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleSaveNewMembers}
              disabled={isSaving}
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