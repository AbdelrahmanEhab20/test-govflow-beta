import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Mail, Phone, Edit2, X } from "lucide-react";
import DepartmentMembersManager from "@/components/departments/DepartmentMembersManager";

export default function DepartmentDetailModal({ 
  department, 
  teamMembers, 
  onClose, 
  onSave,
  isEditing = false 
}) {
  const [editMode, setEditMode] = useState(isEditing);
  const [formData, setFormData] = useState({
    name: department?.name || '',
    description: department?.description || '',
    manager_name: department?.manager_name || '',
    sector: department?.sector || '',
  });

  const departmentMembers = teamMembers.filter(
    m => m.department_name === department?.name
  );

  const handleSave = () => {
    onSave(formData);
    setEditMode(false);
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={!!department} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl">
                {editMode ? 'Edit Department' : department?.name}
              </DialogTitle>
              {!editMode && (
                <p className="text-sm text-slate-500 mt-1">{department?.sector}</p>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setEditMode(!editMode)}
              className="ml-2"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="members">Team Members ({departmentMembers.length})</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            {editMode ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Department Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="sector">Sector</Label>
                  <Input
                    id="sector"
                    value={formData.sector}
                    onChange={(e) => setFormData({...formData, sector: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="manager">Manager Name</Label>
                  <Input
                    id="manager"
                    value={formData.manager_name}
                    onChange={(e) => setFormData({...formData, manager_name: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="mt-1"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                  <Button onClick={handleSave}>Save Changes</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Sector</p>
                  <Badge className="mt-1">{department?.sector}</Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Manager</p>
                  <p className="text-slate-900 dark:text-white font-medium mt-1">{department?.manager_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Description</p>
                  <p className="text-slate-900 dark:text-white mt-1">
                    {department?.description || 'No description provided'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Members</p>
                  <p className="text-slate-900 dark:text-white font-medium mt-1">{departmentMembers.length}</p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Team Members Tab */}
          <TabsContent value="members" className="space-y-3">
            <DepartmentMembersManager
              departmentName={department?.name}
              teamMembers={teamMembers}
              onMembersUpdate={() => {
                // Refresh the modal if needed
              }}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}