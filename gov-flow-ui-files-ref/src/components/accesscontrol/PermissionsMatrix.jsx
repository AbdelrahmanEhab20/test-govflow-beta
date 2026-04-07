import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listRolePermissions, updateRolePermission, createRolePermission } from "@/api/rbacApi";
import { ROLE_PERMISSIONS, PERMISSIONS, ROLES } from "@/components/shared/rbac";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const ALL_ROLES = [
  { value: ROLES.DEPARTMENT_ADMIN, label: "Dept. Admin" },
  { value: ROLES.DEPARTMENT_MANAGER, label: "Dept. Manager" },
  { value: ROLES.TEAM_MEMBER, label: "Team Member" },
  { value: ROLES.EDITOR, label: "Editor" },
  { value: ROLES.VIEWER, label: "Viewer" },
  { value: ROLES.USER, label: "User" },
];

const PERMISSION_GROUPS = {
  "Tasks / Initiatives": [
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_EDIT,
    PERMISSIONS.TASKS_DELETE,
  ],
  "Team": [
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.TEAM_EDIT,
    PERMISSIONS.TEAM_MANAGE_ROLES,
  ],
  "Reports & Analysis": [
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
  ],
  "Routing Rules": [
    PERMISSIONS.ROUTING_VIEW,
    PERMISSIONS.ROUTING_EDIT,
    PERMISSIONS.ROUTING_DELETE,
  ],
  "Email": [
    PERMISSIONS.EMAIL_VIEW,
    PERMISSIONS.EMAIL_MANAGE_RULES,
  ],
  "Departments": [
    PERMISSIONS.DEPARTMENTS_VIEW,
    PERMISSIONS.DEPARTMENTS_EDIT,
    PERMISSIONS.DEPARTMENTS_DELETE,
  ],
  "Profile": [
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_EDIT_OWN,
    PERMISSIONS.PROFILE_EDIT_OTHER,
  ],
  "Settings": [
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_ADMIN,
  ],
};

const formatPermission = (p) => p.split(":")[1]?.replace(/_/g, " ") || p;

export default function PermissionsMatrix() {
  const queryClient = useQueryClient();
  const [matrix, setMatrix] = useState({});

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["role-permissions"],
    queryFn: () => listRolePermissions(),
  });

  useEffect(() => {
    const m = {};
    Object.values(PERMISSIONS).forEach(perm => {
      m[perm] = {};
      ALL_ROLES.forEach(({ value: role }) => {
        const dbRule = rules.find(r => r.role === role && r.permission === perm);
        if (dbRule !== undefined) {
          m[perm][role] = dbRule.granted;
        } else {
          m[perm][role] = ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
        }
      });
    });
    setMatrix(m);
  }, [rules]);

  const upsertMutation = useMutation({
    mutationFn: async ({ role, permission, granted }) => {
      const existing = rules.find(r => r.role === role && r.permission === permission);
      if (existing) {
        return updateRolePermission(existing.id, { granted });
      }
      return createRolePermission({ role, permission, granted });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["role-permissions"] }),
  });

  const handleToggle = (perm, role, current) => {
    const newVal = !current;
    setMatrix(m => ({ ...m, [perm]: { ...m[perm], [role]: newVal } }));
    upsertMutation.mutate({ role, permission: perm, granted: newVal });
  };

  if (isLoading) {
    return <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 min-w-56">Permission</th>
            {ALL_ROLES.map(r => (
              <th key={r.value} className="text-center py-3 px-3 font-semibold text-slate-700 dark:text-slate-300 min-w-28">
                <Badge variant="outline" className="text-xs font-normal">{r.label}</Badge>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
            <React.Fragment key={group}>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <td colSpan={ALL_ROLES.length + 1} className="py-2 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {group}
                </td>
              </tr>
              {perms.map((perm, i) => (
                <tr key={perm} className={`border-b border-slate-100 dark:border-slate-800 ${i % 2 === 0 ? "bg-white dark:bg-slate-900/20" : "bg-slate-50/40 dark:bg-slate-900/40"}`}>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 capitalize">{formatPermission(perm)}</td>
                  {ALL_ROLES.map(({ value: role }) => (
                    <td key={role} className="py-3 px-3 text-center">
                      <Switch
                        checked={matrix[perm]?.[role] ?? false}
                        onCheckedChange={() => handleToggle(perm, role, matrix[perm]?.[role] ?? false)}
                        className="mx-auto"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}