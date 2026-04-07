import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/api/authApi';
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  canAccessPage,
  getAccessiblePages,
  isActionAllowed
} from '@/components/shared/rbac';

/**
 * Hook to check permissions for the current user
 */
export function usePermissions() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const userRole = user?.role;

  return {
    user,
    userRole,
    
    // Single permission check
    hasPermission: (permission) => hasPermission(userRole, permission),
    
    // Multiple permissions (any match)
    hasAnyPermission: (permissions) => hasAnyPermission(userRole, permissions),
    
    // Multiple permissions (all match)
    hasAllPermissions: (permissions) => hasAllPermissions(userRole, permissions),
    
    // Page access check
    canAccessPage: (pageName) => canAccessPage(userRole, pageName),
    
    // Get all accessible pages
    getAccessiblePages: () => getAccessiblePages(userRole),
    
    // Action check (view, create, edit, delete)
    canAction: (action) => isActionAllowed(userRole, action),
    
    // Quick role checks
    isAdmin: () => userRole === 'admin',
    isEditor: () => userRole === 'editor',
    isViewer: () => userRole === 'viewer',
  };
}