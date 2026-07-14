import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutList, LayoutGrid, Users, Mail, Phone, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import DepartmentDetailModal from "./DepartmentDetailModal";

export default function DepartmentsView({
  departments,
  teamMembers = [],
  onDepartmentUpdate,
  onMembersUpdate,
  isSavingDepartment = false,
  isAdmin = false,
  onEditDepartment,
  onDeleteDepartment,
  onClearDepartment,
  isDeletingDepartment = false,
}) {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const handleDepartmentSave = async (updatedData) => {
    if (!selectedDepartment || !onDepartmentUpdate) return;
    await onDepartmentUpdate(selectedDepartment.id, updatedData);
    setSelectedDepartment((prev) => (prev ? { ...prev, ...updatedData } : prev));
  };

  const modal = (
    <DepartmentDetailModal
      department={selectedDepartment}
      teamMembers={teamMembers}
      onClose={() => setSelectedDepartment(null)}
      onSave={handleDepartmentSave}
      onMembersUpdate={onMembersUpdate}
      isSaving={isSavingDepartment}
      isAdmin={isAdmin}
      isDeleting={isDeletingDepartment}
      onEditFull={() => {
        if (selectedDepartment) {
          onEditDepartment?.(selectedDepartment);
          setSelectedDepartment(null);
        }
      }}
      onDelete={async () => {
        if (selectedDepartment) {
          await onDeleteDepartment?.(selectedDepartment.id);
          setSelectedDepartment(null);
        }
      }}
      onClearDetails={() => {
        if (selectedDepartment) {
          onClearDepartment?.(selectedDepartment.id);
          setSelectedDepartment((prev) =>
            prev
              ? {
                  ...prev,
                  description: '',
                  notes: '',
                  tags: [],
                  email: '',
                  phone: '',
                  manager_name: '',
                }
              : prev,
          );
        }
      }}
    />
  );

  if (viewMode === 'list') {
    return (
      <>
        <div>
          <div className="flex justify-end gap-2 mb-4">
            <Button variant={viewMode === 'grid' ? 'outline' : 'default'} size="sm" onClick={() => setViewMode('grid')}>
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
              <LayoutList className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {departments.map((dept) => (
              <Card key={dept.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{dept.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{dept.description}</p>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{dept.manager_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{dept.sector}</p>
                  </div>
                  <Badge variant="outline">{dept.member_count || 0} members</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDepartment(dept)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
        {modal}
      </>
    );
  }

  return (
    <>
      <div>
        <div className="flex justify-end gap-2 mb-4">
          <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
            <LayoutList className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <Card key={dept.id} className="p-4 flex flex-col gap-3 hover:shadow-lg transition-shadow">
              <div>
                <Badge className="mb-2">{dept.sector}</Badge>
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{dept.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{dept.description}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Users className="w-4 h-4" />
                  {dept.manager_name} (Manager)
                </div>
                {dept.email && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Mail className="w-4 h-4" />
                    {dept.email}
                  </div>
                )}
                {dept.phone && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Phone className="w-4 h-4" />
                    {dept.phone}
                  </div>
                )}
              </div>
              <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">{dept.member_count || 0} Members</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setSelectedDepartment(dept)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
      {modal}
    </>
  );
}
