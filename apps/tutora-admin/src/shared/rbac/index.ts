// Public surface of the client-side RBAC model (issue #60).
export {
  USER_ROLES,
  ADMIN_PERMISSIONS,
  ROLE_PERMISSIONS,
  permissionsForRole,
  hasPermission,
  hasAnyPermission,
  canAccessAdmin,
  type UserRole,
  type Permission,
} from './permissions';
