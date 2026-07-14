/**
 * Presentation helpers over the client RBAC model (`@shared/rbac`) for the roles
 * & permissions panel (issue #69). Pure and side-effect-free so the matrix and
 * summaries derive straight from the single source of truth in `@shared/rbac`.
 */
import {
  ADMIN_PERMISSIONS,
  ROLE_PERMISSIONS,
  USER_ROLES,
  type Permission,
  type UserRole,
} from '@shared/rbac';

/** One row of the role → permission matrix: a permission and who holds it. */
export type PermissionRow = {
  permission: Permission;
  grants: Record<UserRole, boolean>;
};

/** Every permission as a matrix row, with a boolean per role. */
export function permissionRows(): PermissionRow[] {
  return ADMIN_PERMISSIONS.map((permission) => ({
    permission,
    grants: Object.fromEntries(
      USER_ROLES.map((role) => [role, ROLE_PERMISSIONS[role].includes(permission)]),
    ) as Record<UserRole, boolean>,
  }));
}

/** How many permissions a role holds. */
export function permissionCount(role: UserRole): number {
  return ROLE_PERMISSIONS[role].length;
}

/**
 * i18n key for a permission's label. `:` is i18next's namespace separator, so a
 * permission like `users:manage` is sanitized to a flat leaf `users_manage`.
 */
export function permissionLabelKey(permission: Permission): string {
  return `rbac.permissions.${permission.replace(':', '_')}`;
}
