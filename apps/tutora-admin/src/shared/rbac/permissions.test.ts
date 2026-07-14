import { describe, expect, it } from 'vitest';

import {
  ADMIN_PERMISSIONS,
  canAccessAdmin,
  hasAnyPermission,
  hasPermission,
  permissionsForRole,
  ROLE_PERMISSIONS,
} from './permissions';

describe('rbac permissions (#60)', () => {
  it('grants ADMIN every declared permission', () => {
    expect(ROLE_PERMISSIONS.ADMIN).toEqual(ADMIN_PERMISSIONS);
    expect(ROLE_PERMISSIONS.ADMIN.length).toBeGreaterThan(0);
  });

  it('grants STUDENT and TUTOR no admin permissions (fails closed)', () => {
    expect(ROLE_PERMISSIONS.STUDENT).toHaveLength(0);
    expect(ROLE_PERMISSIONS.TUTOR).toHaveLength(0);
  });

  it('resolves the permission set for a role, treating null/undefined as empty', () => {
    expect(permissionsForRole('ADMIN')).toEqual(ADMIN_PERMISSIONS);
    expect(permissionsForRole('STUDENT')).toEqual([]);
    expect(permissionsForRole(null)).toEqual([]);
    expect(permissionsForRole(undefined)).toEqual([]);
  });

  it('checks a single permission', () => {
    expect(hasPermission('ADMIN', 'users:manage')).toBe(true);
    expect(hasPermission('TUTOR', 'users:manage')).toBe(false);
    expect(hasPermission(null, 'users:manage')).toBe(false);
  });

  it('treats an empty requirement as allowed and otherwise needs at least one match', () => {
    expect(hasAnyPermission('STUDENT', [])).toBe(true);
    expect(hasAnyPermission('ADMIN', ['logs:view', 'settings:manage'])).toBe(true);
    expect(hasAnyPermission('TUTOR', ['logs:view'])).toBe(false);
  });

  it('restricts admin-panel access to the ADMIN role', () => {
    expect(canAccessAdmin('ADMIN')).toBe(true);
    expect(canAccessAdmin('TUTOR')).toBe(false);
    expect(canAccessAdmin('STUDENT')).toBe(false);
    expect(canAccessAdmin(null)).toBe(false);
  });
});
