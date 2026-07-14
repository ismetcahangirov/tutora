import { describe, expect, it } from 'vitest';

import { ADMIN_PERMISSIONS } from '@shared/rbac';

import { permissionCount, permissionLabelKey, permissionRows } from './permissions';

describe('permissionRows', () => {
  it('has one row per admin permission', () => {
    expect(permissionRows()).toHaveLength(ADMIN_PERMISSIONS.length);
  });

  it('grants every permission to ADMIN and none to TUTOR/STUDENT', () => {
    for (const row of permissionRows()) {
      expect(row.grants.ADMIN).toBe(true);
      expect(row.grants.TUTOR).toBe(false);
      expect(row.grants.STUDENT).toBe(false);
    }
  });
});

describe('permissionCount', () => {
  it('counts the full set for ADMIN and zero for other roles', () => {
    expect(permissionCount('ADMIN')).toBe(ADMIN_PERMISSIONS.length);
    expect(permissionCount('TUTOR')).toBe(0);
    expect(permissionCount('STUDENT')).toBe(0);
  });
});

describe('permissionLabelKey', () => {
  it('sanitizes the ":" namespace separator to a flat leaf key', () => {
    expect(permissionLabelKey('users:manage')).toBe('rbac.permissions.users_manage');
    expect(permissionLabelKey('dashboard:view')).toBe('rbac.permissions.dashboard_view');
  });
});
