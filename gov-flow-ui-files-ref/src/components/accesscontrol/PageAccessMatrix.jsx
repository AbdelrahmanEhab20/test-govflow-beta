import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listRolePageAccess, updateRolePageAccess, createRolePageAccess } from "@/api/rbacApi";
import { PAGE_ACCESS, ROLES } from "@/components/shared/rbac";
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

const ALL_PAGES = Object.keys(PAGE_ACCESS);

export default function PageAccessMatrix() {
  const queryClient = useQueryClient();
  const [matrix, setMatrix] = useState({});

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["role-page-access"],
    queryFn: () => listRolePageAccess(),
  });

  // Build matrix from DB rules, falling back to static defaults
  useEffect(() => {
    const m = {};
    ALL_PAGES.forEach(page => {
      m[page] = {};
      ALL_ROLES.forEach(({ value: role }) => {
        const dbRule = rules.find(r => r.role === role && r.page === page);
        if (dbRule !== undefined) {
          m[page][role] = dbRule.can_access;
        } else {
          // fallback to static default
          m[page][role] = PAGE_ACCESS[page]?.includes(role) ?? false;
        }
      });
    });
    setMatrix(m);
  }, [rules]);

  const upsertMutation = useMutation({
    mutationFn: async ({ role, page, can_access }) => {
      const existing = rules.find(r => r.role === role && r.page === page);
      if (existing) {
        return updateRolePageAccess(existing.id, { can_access });
      }
      return createRolePageAccess({ role, page, can_access });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["role-page-access"] }),
  });

  const handleToggle = (page, role, current) => {
    const newVal = !current;
    setMatrix(m => ({ ...m, [page]: { ...m[page], [role]: newVal } }));
    upsertMutation.mutate({ role, page, can_access: newVal });
  };

  if (isLoading) {
    return <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 min-w-44">Page</th>
            {ALL_ROLES.map(r => (
              <th key={r.value} className="text-center py-3 px-3 font-semibold text-slate-700 dark:text-slate-300 min-w-28">
                <Badge variant="outline" className="text-xs font-normal">{r.label}</Badge>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ALL_PAGES.map((page, i) => (
            <tr key={page} className={`border-b border-slate-100 dark:border-slate-800 ${i % 2 === 0 ? "bg-slate-50/50 dark:bg-slate-900/30" : ""}`}>
              <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{page}</td>
              {ALL_ROLES.map(({ value: role }) => (
                <td key={role} className="py-3 px-3 text-center">
                  <Switch
                    checked={matrix[page]?.[role] ?? false}
                    onCheckedChange={() => handleToggle(page, role, matrix[page]?.[role] ?? false)}
                    className="mx-auto"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}