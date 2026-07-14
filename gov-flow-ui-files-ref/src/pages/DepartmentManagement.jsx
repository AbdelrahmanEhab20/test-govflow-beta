import React, { useMemo, useState } from "react";
import { getCurrentUser } from "@/api/authApi";
import { listDepartments, updateDepartment, deleteDepartment, clearDepartmentDetails } from "@/api/departmentsApi";
import { listUsers } from "@/api/usersApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import DepartmentForm from "../components/departments/DepartmentForm";
import InviteTeamMemberDialog from "../components/team/InviteTeamMemberDialog";
import ImportContactsDialog from "../components/team/ImportContactsDialog";
import UserManagementTable from "../components/team/UserManagementTable";
import DepartmentsView from "../components/team/DepartmentsView";
import DepartmentHierarchyView from "../components/team/DepartmentHierarchyView";
import SectorsView from "../components/team/SectorsView";
import { useToast } from "@/components/ui/use-toast";
import { hasPermission, PERMISSIONS } from "@/components/shared/rbac";

function memberBelongsToDepartment(member, department) {
  if (department.id && member.department_id === department.id) return true;
  if (department.name && member.department_name === department.name) return true;
  return false;
}

export default function DepartmentManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDept, setEditingDept] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [activeView, setActiveView] = useState('departments');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => listDepartments(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(),
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: ({ id, data }) => updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({
        title: 'Department updated',
        description: 'Changes were saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Could not save department',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: (id) => deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Department deleted', description: 'Department was removed and members were unassigned.' });
    },
    onError: (error) => {
      toast({
        title: 'Could not delete department',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const clearDepartmentMutation = useMutation({
    mutationFn: (id) => clearDepartmentDetails(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({ title: 'Details cleared', description: 'Optional department fields were reset.' });
    },
    onError: (error) => {
      toast({
        title: 'Could not clear details',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const refreshMemberQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['departments'] });
  };

  const hasTeamManagementAccess = ['admin', 'department_admin'].includes(user?.role);
  const isAdmin = hasPermission(user?.role, PERMISSIONS.DEPARTMENTS_DELETE);
  const canInvite = hasPermission(user?.role, PERMISSIONS.USERS_INVITE);

  if (user && !hasTeamManagementAccess) {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-center py-12">
          <p className="text-slate-500 mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => navigate(createPageUrl('Dashboard'))}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const normalizedTeamMembers = useMemo(
    () =>
      users.map((entry) => ({
        id: entry.id,
        name: entry.full_name || entry.email,
        email: entry.email,
        job_title: entry.position || '',
        department_id: entry.department_id || '',
        department_name: entry.department || '',
        sector_name: '',
        mobile_number: entry.phone || '',
        avatar_url: entry.avatar_url || '',
      })),
    [users],
  );

  const filteredUsers = users.filter((member) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.full_name?.toLowerCase().includes(query) ||
      member.position?.toLowerCase().includes(query) ||
      member.department?.toLowerCase().includes(query) ||
      member.email?.toLowerCase().includes(query)
    );
  });

  const filteredDepartmentsView = departments
    .filter((dept) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        dept.name?.toLowerCase().includes(query) ||
        dept.sector?.toLowerCase().includes(query) ||
        dept.manager_name?.toLowerCase().includes(query)
      );
    })
    .map((dept) => ({
      ...dept,
      member_count: normalizedTeamMembers.filter((member) =>
        memberBelongsToDepartment(member, dept),
      ).length,
    }));

  const sectors = Array.from(
    new Set(departments.map((dept) => dept.sector).filter(Boolean)),
  )
    .map((sectorName) => ({
      name: sectorName,
      departments: departments.filter((dept) => dept.sector === sectorName).length,
      members: normalizedTeamMembers.filter((member) => {
        const dept = departments.find((item) => memberBelongsToDepartment(member, item));
        return dept?.sector === sectorName;
      }).length,
    }))
    .sort((a, b) => b.members - a.members)
    .filter((sector) => {
      if (!searchQuery) return true;
      return sector.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

  const departmentSectorCount = new Set(
    filteredDepartmentsView.map((dept) => dept.sector).filter(Boolean),
  ).size;
  const activeDepartmentCount = filteredDepartmentsView.filter((dept) => dept.is_active !== false).length;

  const handleDepartmentUpdate = async (departmentId, updatedData) => {
    await updateDepartmentMutation.mutateAsync({ id: departmentId, data: updatedData });
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingDept(null);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['departments'] });
    handleFormClose();
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Team Management</h1>
          <p className="text-slate-500 dark:text-slate-300 mt-1">Manage organizational departments and sectors</p>
        </div>
      </div>

      {!showForm && (
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex gap-2">
            <Button
              variant={activeView === 'members' ? 'default' : 'outline'}
              onClick={() => setActiveView('members')}
            >
              Team Members
            </Button>
            <Button
              variant={activeView === 'departments' ? 'default' : 'outline'}
              onClick={() => setActiveView('departments')}
            >
              Departments
            </Button>
            <Button
              variant={activeView === 'hierarchy' ? 'default' : 'outline'}
              onClick={() => setActiveView('hierarchy')}
            >
              Hierarchy
            </Button>
            <Button
              variant={activeView === 'sectors' ? 'default' : 'outline'}
              onClick={() => setActiveView('sectors')}
            >
              Sectors
            </Button>
          </div>
          <div className="flex-1 flex flex-wrap gap-4 min-w-0">
            <div className="relative flex-1 min-w-[220px] sm:flex-none sm:w-64 isolate">
              <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto w-4 h-4 text-slate-400" />
              <Input
                placeholder={`Search ${activeView}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {activeView === 'departments' && (
              <>
                <ImportContactsDialog />
                {canInvite && <InviteTeamMemberDialog departments={departments} currentUser={user} />}
                <Button onClick={() => setShowForm(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Department
                </Button>
              </>
            )}
            {activeView === 'members' && canInvite && (
              <InviteTeamMemberDialog departments={departments} currentUser={user} />
            )}
          </div>
        </div>
      )}

      {showForm ? (
        <div className="max-w-2xl">
          <DepartmentForm
            department={editingDept}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        </div>
      ) : (
        <>
          {activeView === 'members' && (
            <UserManagementTable
              users={filteredUsers}
              departments={departments}
              currentUser={user}
            />
          )}
          {activeView === 'departments' && (
            <DepartmentsView
              departments={filteredDepartmentsView}
              teamMembers={normalizedTeamMembers}
              onDepartmentUpdate={handleDepartmentUpdate}
              onMembersUpdate={refreshMemberQueries}
              isSavingDepartment={updateDepartmentMutation.isPending}
              isAdmin={isAdmin}
              onEditDepartment={(dept) => {
                setEditingDept(dept);
                setShowForm(true);
              }}
              onDeleteDepartment={(id) => deleteDepartmentMutation.mutate(id)}
              onClearDepartment={(id) => clearDepartmentMutation.mutate(id)}
            />
          )}
          {activeView === 'hierarchy' && (
            <DepartmentHierarchyView
              departments={departments}
              teamMembers={normalizedTeamMembers}
              onDepartmentSelect={(dept) => {
                setEditingDept(dept);
                setShowForm(true);
              }}
            />
          )}
          {activeView === 'sectors' && <SectorsView sectors={sectors} />}
        </>
      )}

      {!showForm && (
        <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {filteredDepartmentsView.length}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Departments</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{departmentSectorCount}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sectors</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{normalizedTeamMembers.length}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Team Members</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{activeDepartmentCount}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Active</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
