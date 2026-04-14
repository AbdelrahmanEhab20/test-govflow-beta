import React, { useMemo, useState } from "react";
import { getCurrentUser } from "@/api/authApi";
import { listDepartments, listTeams } from "@/api/departmentsApi";
import { listUsers } from "@/api/usersApi";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import DepartmentForm from "../components/departments/DepartmentForm";
import InviteTeamMemberDialog from "../components/team/InviteTeamMemberDialog";
import ImportContactsDialog from "../components/team/ImportContactsDialog";
import TeamMembersView from "../components/team/TeamMembersView";
import DepartmentsView from "../components/team/DepartmentsView";
import DepartmentHierarchyView from "../components/team/DepartmentHierarchyView";
import SectorsView from "../components/team/SectorsView";

export default function DepartmentManagement() {
  const navigate = useNavigate();
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

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: () => listTeams(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(),
  });

  const { data: databaseDepartments = [] } = useQuery({
    queryKey: ['databaseDepartments'],
    queryFn: () => listDepartments(),
  });

  const hasTeamManagementAccess = ['admin', 'department_admin'].includes(user?.role);

  // Allow admin and department_admin to match backend policy.
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

  const filteredDepartments = departments.filter(dept => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      dept.name?.toLowerCase().includes(query) ||
      dept.sector?.toLowerCase().includes(query) ||
      dept.manager_name?.toLowerCase().includes(query)
    );
  });

  const normalizedTeamMembers = useMemo(() => {
    if (teamMembers.length > 0) return teamMembers;
    return users.map((user) => ({
      id: user.id,
      name: user.full_name || user.email,
      email: user.email,
      job_title: user.position || '',
      department_name: user.department || 'Development',
      sector_name: '',
      mobile_number: user.phone || '',
      avatar_url: user.avatar_url || '',
    }));
  }, [teamMembers, users]);

  const filteredTeamMembers = normalizedTeamMembers.filter(member => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.name?.toLowerCase().includes(query) ||
      member.job_title?.toLowerCase().includes(query) ||
      member.department_name?.toLowerCase().includes(query) ||
      member.email?.toLowerCase().includes(query)
    );
  });

  const filteredDepartmentsView = filteredDepartments.map((dept) => ({
    ...dept,
    member_count: normalizedTeamMembers.filter((member) => member.department_name === dept.name).length,
  })).filter(dept => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      dept.name?.toLowerCase().includes(query) ||
      dept.sector?.toLowerCase().includes(query) ||
      dept.manager_name?.toLowerCase().includes(query)
    );
  });

  const sectors = Array.from(new Set(
    normalizedTeamMembers.map(member => member.sector_name).filter(s => s)
  ))
    .map(sectorName => ({
      name: sectorName,
      departments: new Set(normalizedTeamMembers
        .filter(m => m.sector_name === sectorName)
        .map(m => m.department_name)
        .filter(d => d)
      ).size,
      members: normalizedTeamMembers.filter(m => m.sector_name === sectorName).length
    }))
    .sort((a, b) => b.members - a.members)
    .filter(sector => {
      if (!searchQuery) return true;
      return sector.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

  const departmentSectorCount = new Set(
    filteredDepartmentsView.map((dept) => dept.sector).filter(Boolean)
  ).size;
  const activeDepartmentCount = filteredDepartmentsView.filter((dept) => dept.is_active !== false).length;

  const handleEdit = (dept) => {
    setEditingDept(dept);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingDept(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team Management</h1>
          <p className="text-slate-500 mt-1">Manage organizational departments and sectors</p>
        </div>
      </div>

      {/* View Tabs */}
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
                <InviteTeamMemberDialog departments={departments} />
                <Button onClick={() => setShowForm(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Department
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* View Content */}
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
          {activeView === 'members' && <TeamMembersView members={filteredTeamMembers} />}
          {activeView === 'departments' && (
            <DepartmentsView 
              departments={filteredDepartmentsView} 
              teamMembers={normalizedTeamMembers}
            />
          )}
          {activeView === 'hierarchy' && (
            <DepartmentHierarchyView 
              departments={databaseDepartments} 
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

      {/* Stats */}
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