import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit2, Trash2, Eraser } from "lucide-react";
import DepartmentMembersManager from "@/components/departments/DepartmentMembersManager";

function memberBelongsToDepartment(member, department) {
  if (!department) return false;
  if (department.id && member.department_id === department.id) return true;
  if (department.name && member.department_name === department.name) return true;
  return false;
}

export default function DepartmentDetailModal({
  department,
  teamMembers,
  onClose,
  onSave,
  onMembersUpdate,
  isEditing = false,
  isSaving = false,
  isAdmin = false,
  onEditFull,
  onDelete,
  onClearDetails,
}) {
  const [editMode, setEditMode] = useState(isEditing);
  const [formData, setFormData] = useState({
    name: department?.name || '',
    description: department?.description || '',
    manager_name: department?.manager_name || '',
    sector: department?.sector || '',
  });

  useEffect(() => {
    setFormData({
      name: department?.name || '',
      description: department?.description || '',
      manager_name: department?.manager_name || '',
      sector: department?.sector || '',
    });
    setEditMode(isEditing);
  }, [department?.id, isEditing]);

  const departmentMembers = teamMembers.filter((member) =>
    memberBelongsToDepartment(member, department),
  );

  const handleSave = async () => {
    try {
      await onSave?.(formData);
      setEditMode(false);
    } catch {
      // Keep edit mode open when save fails.
    }
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

        {isAdmin && !editMode && (
          <div className="flex flex-wrap gap-2 pb-2">
            <Button variant="outline" size="sm" onClick={onEditFull}>
              Full edit
            </Button>
            <Button variant="outline" size="sm" onClick={onClearDetails}>
              <Eraser className="w-4 h-4 mr-1" />
              Clear details
            </Button>
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        )}

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="members">Team Members ({departmentMembers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            {editMode ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Department Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="sector">Sector</Label>
                  <Input
                    id="sector"
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="manager">Manager Name</Label>
                  <Input
                    id="manager"
                    value={formData.manager_name}
                    onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditMode(false)} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
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

          <TabsContent value="members" className="space-y-3">
            <DepartmentMembersManager
              departmentId={department?.id}
              departmentName={department?.name}
              teamMembers={teamMembers}
              onMembersUpdate={onMembersUpdate}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
