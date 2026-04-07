import React from 'react';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/components/shared/rbac';
import AccessDenied from '@/components/shared/AccessDenied';

/**
 * Component that guards content based on permissions
 * Supports three modes: single permission, any of multiple, all of multiple
 */
export default function PermissionGuard({ 
  children, 
  userRole,
  permission, // single permission
  permissions, // multiple permissions (any match)
  requireAll = false, // if true, requires all permissions
  fallback = null,
  showAccessDenied = false
}) {
  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(userRole, permission);
  } else if (permissions && Array.isArray(permissions)) {
    hasAccess = requireAll 
      ? hasAllPermissions(userRole, permissions)
      : hasAnyPermission(userRole, permissions);
  }

  if (!hasAccess) {
    return showAccessDenied ? (
      <AccessDenied />
    ) : (
      fallback || null
    );
  }

  return children;
}