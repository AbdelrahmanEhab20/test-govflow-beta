import React, { createContext, useContext, useMemo } from 'react';
import { ROLES } from '@/components/shared/rbac';

const EffectiveRoleContext = createContext({
  effectiveRole: null,
  actualRole: null,
  isOwnTasksOnly: false,
});

/** Roles that may only see/edit their own lead tasks in the UI. */
export const OWN_TASKS_ONLY_ROLES = new Set([ROLES.TEAM_MEMBER, ROLES.USER]);

export function isOwnTasksOnlyRole(role) {
  return OWN_TASKS_ONLY_ROLES.has(String(role || ''));
}

export function EffectiveRoleProvider({ effectiveRole, actualRole, children }) {
  const value = useMemo(
    () => ({
      effectiveRole: effectiveRole || null,
      actualRole: actualRole || null,
      isOwnTasksOnly: isOwnTasksOnlyRole(effectiveRole),
    }),
    [effectiveRole, actualRole],
  );

  return (
    <EffectiveRoleContext.Provider value={value}>
      {children}
    </EffectiveRoleContext.Provider>
  );
}

export function useEffectiveRole() {
  return useContext(EffectiveRoleContext);
}
