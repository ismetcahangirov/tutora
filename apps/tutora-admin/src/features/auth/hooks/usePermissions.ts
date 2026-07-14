/**
 * Binds the pure RBAC model to the current user's role. This is the single place
 * the UI asks "may the signed-in admin do X?" — nav filtering and route guards
 * both go through it, so swapping to backend-driven permissions (issue #69)
 * touches only this hook.
 */
import { useMemo } from 'react';

import {
  hasAnyPermission,
  hasPermission,
  permissionsForRole,
  type Permission,
  type UserRole,
} from '@shared/rbac';

import { useAuthStore } from '../store/auth-store';

export type UsePermissions = {
  role: UserRole | null;
  permissions: readonly Permission[];
  can: (permission: Permission) => boolean;
  canAny: (permissions: readonly Permission[]) => boolean;
};

export function usePermissions(): UsePermissions {
  const role = useAuthStore((state) => state.user?.role ?? null);

  return useMemo(
    () => ({
      role,
      permissions: permissionsForRole(role),
      can: (permission: Permission) => hasPermission(role, permission),
      canAny: (permissions: readonly Permission[]) => hasAnyPermission(role, permissions),
    }),
    [role],
  );
}
