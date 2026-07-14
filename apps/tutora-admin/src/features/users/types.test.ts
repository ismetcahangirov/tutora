import { describe, expect, it } from 'vitest';

import { adminUserSchema, userStatus } from './types';

const rawUser = {
  id: 'u1',
  email: 'alice@example.com',
  emailVerified: true,
  name: 'Alice',
  avatarUrl: null,
  locale: 'en',
  provider: 'GOOGLE',
  role: 'TUTOR',
  onboardingCompleted: true,
  deletedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

describe('adminUserSchema', () => {
  it('parses a valid admin user payload', () => {
    const user = adminUserSchema.parse(rawUser);
    expect(user.role).toBe('TUTOR');
    expect(user.email).toBe('alice@example.com');
  });

  it('accepts a null role (not yet onboarded)', () => {
    expect(adminUserSchema.parse({ ...rawUser, role: null }).role).toBeNull();
  });

  it('rejects an unknown role', () => {
    expect(adminUserSchema.safeParse({ ...rawUser, role: 'SUPERADMIN' }).success).toBe(false);
  });
});

describe('userStatus', () => {
  it('is active when the account is not soft-deleted', () => {
    expect(userStatus(adminUserSchema.parse(rawUser))).toBe('active');
  });

  it('is suspended when the account is soft-deleted', () => {
    const suspended = adminUserSchema.parse({ ...rawUser, deletedAt: '2026-02-01T00:00:00.000Z' });
    expect(userStatus(suspended)).toBe('suspended');
  });
});
