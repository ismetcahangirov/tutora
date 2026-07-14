/**
 * Client-side RBAC model for the admin panel (issue #60).
 *
 * The backend authorizes by coarse role (STUDENT / TUTOR / ADMIN) today, so the
 * admin panel is ADMIN-only. But navigation and routes gate on **permissions**,
 * not the raw role, so fine-grained, backend-driven permissions (issue #69) can
 * later replace `permissionsForRole` without touching a single call site.
 */

/** Roles issued by the backend. Kept in sync with the API's `UserRole` enum. */
export const USER_ROLES = ['STUDENT', 'TUTOR', 'ADMIN'] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Every capability the admin panel gates on. One per top-level section. */
export const ADMIN_PERMISSIONS = [
  'dashboard:view',
  'users:manage',
  'verifications:review',
  'reviews:moderate',
  'taxonomy:manage',
  'notifications:send',
  'cms:manage',
  'payments:manage',
  'roles:manage',
  'settings:manage',
  'logs:view',
] as const;

export type Permission = (typeof ADMIN_PERMISSIONS)[number];

/**
 * Role → granted permissions. ADMIN receives the full set; the other roles
 * receive none, so a non-admin principal fails every gate.
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  ADMIN: ADMIN_PERMISSIONS,
  TUTOR: [],
  STUDENT: [],
};

/** The permissions granted to a role; an unknown/absent role yields none. */
export function permissionsForRole(role: UserRole | null | undefined): readonly Permission[] {
  return role ? ROLE_PERMISSIONS[role] : [];
}

/** Whether a role holds a specific permission. */
export function hasPermission(role: UserRole | null | undefined, permission: Permission): boolean {
  return permissionsForRole(role).includes(permission);
}

/**
 * Whether a role holds at least one of the required permissions. An empty
 * requirement means "no restriction" and is always allowed.
 */
export function hasAnyPermission(
  role: UserRole | null | undefined,
  required: readonly Permission[],
): boolean {
  if (required.length === 0) return true;
  const granted = permissionsForRole(role);
  return required.some((permission) => granted.includes(permission));
}

/** Coarse gate for entering the admin panel at all. Fails closed. */
export function canAccessAdmin(role: UserRole | null | undefined): boolean {
  return role === 'ADMIN';
}
