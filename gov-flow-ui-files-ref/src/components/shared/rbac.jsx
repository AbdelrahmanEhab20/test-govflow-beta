// Role definitions and permissions
const ROLES = {
  ADMIN: 'admin',
  DEPARTMENT_ADMIN: 'department_admin',
  DEPARTMENT_MANAGER: 'department_manager',
  TEAM_MEMBER: 'team_member',
  EDITOR: 'editor',
  VIEWER: 'viewer',
  USER: 'user'
};

// Permission definitions per feature/section
const PERMISSIONS = {
  // Tasks/Initiatives
  TASKS_VIEW: 'tasks:view',
  TASKS_EDIT: 'tasks:edit',
  TASKS_DELETE: 'tasks:delete',
  TASKS_CREATE: 'tasks:create',

  // Team Management
  TEAM_VIEW: 'team:view',
  TEAM_EDIT: 'team:edit',
  TEAM_MANAGE_ROLES: 'team:manage_roles',
  USERS_DELETE: 'users:delete',
  USERS_INVITE: 'users:invite',

  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',

  // Routing Rules
  ROUTING_VIEW: 'routing:view',
  ROUTING_EDIT: 'routing:edit',
  ROUTING_DELETE: 'routing:delete',

  // Profile Management
  PROFILE_VIEW_OWN: 'profile:view_own',
  PROFILE_EDIT_OWN: 'profile:edit_own',
  PROFILE_EDIT_OTHER: 'profile:edit_other',

  // Email Management
  EMAIL_VIEW: 'email:view',
  EMAIL_MANAGE_RULES: 'email:manage_rules',

  // Departments
  DEPARTMENTS_VIEW: 'departments:view',
  DEPARTMENTS_EDIT: 'departments:edit',
  DEPARTMENTS_DELETE: 'departments:delete',

  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_ADMIN: 'settings:admin'
};

// Role to permissions mapping
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Admin has all permissions
    ...Object.values(PERMISSIONS)
  ],
  [ROLES.DEPARTMENT_ADMIN]: [
    // Department admin has most permissions except user management
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_EDIT,
    PERMISSIONS.TASKS_DELETE,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.TEAM_EDIT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.ROUTING_VIEW,
    PERMISSIONS.ROUTING_EDIT,
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_EDIT_OWN,
    PERMISSIONS.EMAIL_VIEW,
    PERMISSIONS.EMAIL_MANAGE_RULES,
    PERMISSIONS.DEPARTMENTS_VIEW,
    PERMISSIONS.DEPARTMENTS_EDIT,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_ADMIN
  ],
  [ROLES.DEPARTMENT_MANAGER]: [
    // Manager can manage tasks and team but limited admin access
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_EDIT,
    PERMISSIONS.TASKS_DELETE,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.TEAM_EDIT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.ROUTING_VIEW,
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_EDIT_OWN,
    PERMISSIONS.EMAIL_VIEW,
    PERMISSIONS.DEPARTMENTS_VIEW,
    PERMISSIONS.SETTINGS_VIEW
  ],
  [ROLES.TEAM_MEMBER]: [
    // Team member can view and manage their own tasks/items
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_EDIT,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_EDIT_OWN,
    PERMISSIONS.EMAIL_VIEW,
    PERMISSIONS.SETTINGS_VIEW
  ],
  [ROLES.EDITOR]: [
    // Editor can view and edit most things, but not admin functions
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_EDIT,
    PERMISSIONS.TASKS_DELETE,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.TEAM_EDIT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.ROUTING_VIEW,
    PERMISSIONS.ROUTING_EDIT,
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_EDIT_OWN,
    PERMISSIONS.EMAIL_VIEW,
    PERMISSIONS.EMAIL_MANAGE_RULES,
    PERMISSIONS.DEPARTMENTS_VIEW,
    PERMISSIONS.SETTINGS_VIEW
  ],
  [ROLES.VIEWER]: [
    // Viewer can only view/read data
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.ROUTING_VIEW,
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.EMAIL_VIEW,
    PERMISSIONS.DEPARTMENTS_VIEW,
    PERMISSIONS.SETTINGS_VIEW
  ],
  [ROLES.USER]: [
    // User is legacy role, treat as viewer
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_EDIT_OWN,
    PERMISSIONS.EMAIL_VIEW,
    PERMISSIONS.SETTINGS_VIEW
  ]
};

// Page-level access control
const PAGE_ACCESS = {
  Tasks: [ROLES.ADMIN, ROLES.DEPARTMENT_ADMIN, ROLES.DEPARTMENT_MANAGER, ROLES.TEAM_MEMBER, ROLES.EDITOR, ROLES.USER, ROLES.VIEWER],
  KanbanBoard: [ROLES.ADMIN, ROLES.DEPARTMENT_ADMIN, ROLES.DEPARTMENT_MANAGER, ROLES.TEAM_MEMBER, ROLES.EDITOR, ROLES.USER, ROLES.VIEWER],
  EmailInbox: [ROLES.ADMIN, ROLES.DEPARTMENT_ADMIN, ROLES.DEPARTMENT_MANAGER, ROLES.TEAM_MEMBER, ROLES.EDITOR, ROLES.USER, ROLES.VIEWER],
  CalendarView: [ROLES.ADMIN, ROLES.DEPARTMENT_ADMIN, ROLES.DEPARTMENT_MANAGER, ROLES.TEAM_MEMBER, ROLES.EDITOR, ROLES.USER, ROLES.VIEWER],
  Reports: [ROLES.ADMIN, ROLES.DEPARTMENT_ADMIN, ROLES.DEPARTMENT_MANAGER, ROLES.TEAM_MEMBER, ROLES.EDITOR, ROLES.USER, ROLES.VIEWER],
  Team: [ROLES.ADMIN, ROLES.DEPARTMENT_ADMIN, ROLES.DEPARTMENT_MANAGER, ROLES.TEAM_MEMBER, ROLES.EDITOR, ROLES.USER, ROLES.VIEWER],
  Profile: [ROLES.ADMIN, ROLES.DEPARTMENT_ADMIN, ROLES.DEPARTMENT_MANAGER, ROLES.TEAM_MEMBER, ROLES.EDITOR, ROLES.USER, ROLES.VIEWER],
  // Admin only pages
  Leaderboard: [ROLES.ADMIN, ROLES.DEPARTMENT_ADMIN, ROLES.DEPARTMENT_MANAGER],
  TeamPerformanceDashboard: [ROLES.ADMIN, ROLES.DEPARTMENT_ADMIN],
  DepartmentManagement: [ROLES.ADMIN, ROLES.DEPARTMENT_ADMIN],
  WorkflowStageManagement: [ROLES.ADMIN, ROLES.DEPARTMENT_ADMIN],
  RoutingRules: [ROLES.ADMIN, ROLES.DEPARTMENT_ADMIN, ROLES.EDITOR],
  Settings: [ROLES.ADMIN, ROLES.DEPARTMENT_ADMIN, ROLES.DEPARTMENT_MANAGER, ROLES.TEAM_MEMBER, ROLES.EDITOR, ROLES.USER],
  AccessControl: [ROLES.ADMIN],
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (userRole, permission) => {
  if (!userRole || !ROLE_PERMISSIONS[userRole]) {
    return false;
  }
  return ROLE_PERMISSIONS[userRole].includes(permission);
};

/**
 * Check if user has any of the given permissions
 */
export const hasAnyPermission = (userRole, permissions) => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

/**
 * Check if user has all of the given permissions
 */
export const hasAllPermissions = (userRole, permissions) => {
  return permissions.every(permission => hasPermission(userRole, permission));
};

/**
 * Check if user can access a specific page
 */
export const canAccessPage = (userRole, pageName) => {
  const allowedRoles = PAGE_ACCESS[pageName];
  if (!allowedRoles) {
    // If page not in ACCESS list, allow all roles
    return true;
  }
  return allowedRoles.includes(userRole);
};

/**
 * Get all pages accessible by a role
 */
export const getAccessiblePages = (userRole) => {
  return Object.entries(PAGE_ACCESS)
    .filter(([_, roles]) => roles.includes(userRole))
    .map(([page]) => page);
};

/**
 * Check if action is allowed based on role and permission
 */
export const isActionAllowed = (userRole, action) => {
  const permissionMap = {
    'view': PERMISSIONS.TASKS_VIEW,
    'create': PERMISSIONS.TASKS_CREATE,
    'edit': PERMISSIONS.TASKS_EDIT,
    'delete': PERMISSIONS.TASKS_DELETE,
  };
  const permission = permissionMap[action];
  return permission ? hasPermission(userRole, permission) : false;
};

export { ROLES, PERMISSIONS, ROLE_PERMISSIONS, PAGE_ACCESS };