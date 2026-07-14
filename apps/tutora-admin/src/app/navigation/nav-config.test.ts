import { describe, expect, it } from 'vitest';

import { hasPermission, type Permission, type UserRole } from '@shared/rbac';

import { NAV_ITEMS, visibleNavItems } from './nav-config';

const canFor = (role: UserRole | null) => (permission: Permission) =>
  hasPermission(role, permission);

describe('nav-config (#60)', () => {
  it('exposes every section with a unique path and permission', () => {
    const paths = NAV_ITEMS.map((item) => item.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(NAV_ITEMS.every((item) => item.permission.length > 0)).toBe(true);
  });

  it('shows all sections to an admin', () => {
    expect(visibleNavItems(NAV_ITEMS, canFor('ADMIN'))).toHaveLength(NAV_ITEMS.length);
  });

  it('hides every section from a non-admin', () => {
    expect(visibleNavItems(NAV_ITEMS, canFor('TUTOR'))).toHaveLength(0);
    expect(visibleNavItems(NAV_ITEMS, canFor(null))).toHaveLength(0);
  });
});
