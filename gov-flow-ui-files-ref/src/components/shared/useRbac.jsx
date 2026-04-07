import { useQuery } from "@tanstack/react-query";
import { listRolePageAccess, listRolePermissions } from "@/api/rbacApi";
import { PAGE_ACCESS, ROLE_PERMISSIONS } from "./rbac";

/**
 * Returns dynamic canAccessPage and hasPermission functions
 * that merge DB overrides on top of the static rbac defaults.
 */
export function useRbac(userRole) {
  const { data: pageRules = [] } = useQuery({
    queryKey: ["role-page-access"],
    queryFn: () => listRolePageAccess(),
    staleTime: 60000,
  });

  const { data: permRules = [] } = useQuery({
    queryKey: ["role-permissions"],
    queryFn: () => listRolePermissions(),
    staleTime: 60000,
  });

  const canAccessPage = (role, page) => {
    if (role === "admin") return true;
    const dbRule = pageRules.find(r => r.role === role && r.page === page);
    if (dbRule !== undefined) return dbRule.can_access;
    return PAGE_ACCESS[page]?.includes(role) ?? true;
  };

  const hasPermission = (role, permission) => {
    if (role === "admin") return true;
    const dbRule = permRules.find(r => r.role === role && r.permission === permission);
    if (dbRule !== undefined) return dbRule.granted;
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
  };

  return { canAccessPage, hasPermission };
}