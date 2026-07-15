import type { UserRole } from '@prisma/client';

/**
 * A small in-memory Prisma double for the auth + users lifecycle. Unlike the
 * per-call `jest.fn` mocks used elsewhere, this keeps real state for the `user`
 * and `refreshToken` tables so a token the API actually issued can be fed back
 * into `/auth/refresh`, rotated, and then detected on reuse — the security
 * property that only a stateful backing store can exercise end-to-end.
 *
 * It implements exactly the query shapes `UsersService` and `TokenService`
 * issue; anything outside that surface is intentionally absent.
 */

interface StoredUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  locale: string | null;
  role: UserRole | null;
  onboardingCompleted: boolean;
  googleId: string | null;
  emailVerified: boolean;
  provider: string;
  deletedAt: Date | null;
}

interface StoredRefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

interface UserWhere {
  id?: string;
  email?: string;
  googleId?: string;
}

interface UserCreateData {
  email: string;
  emailVerified?: boolean;
  googleId?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  locale?: string | null;
  provider?: string;
}

interface UserUpdateData {
  role?: UserRole;
  onboardingCompleted?: boolean;
  name?: string | null;
  avatarUrl?: string | null;
  locale?: string | null;
  googleId?: string | null;
}

interface RefreshCreateData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

interface RefreshUpdateManyWhere {
  tokenHash?: string;
  userId?: string;
  revokedAt: null;
}

export interface StatefulAuthPrisma {
  user: {
    findUnique(args: { where: UserWhere }): Promise<StoredUser | null>;
    create(args: { data: UserCreateData }): Promise<StoredUser>;
    update(args: { where: { id: string }; data: UserUpdateData }): Promise<StoredUser>;
  };
  refreshToken: {
    create(args: { data: RefreshCreateData }): Promise<StoredRefreshToken>;
    findUnique(args: { where: { tokenHash: string } }): Promise<StoredRefreshToken | null>;
    update(args: { where: { id: string }; data: { revokedAt: Date } }): Promise<StoredRefreshToken>;
    updateMany(args: {
      where: RefreshUpdateManyWhere;
      data: { revokedAt: Date };
    }): Promise<{ count: number }>;
  };
}

export function createStatefulAuthPrisma(): StatefulAuthPrisma {
  const users: StoredUser[] = [];
  const refreshTokens: StoredRefreshToken[] = [];
  let seq = 0;
  const nextId = (prefix: string): string => `${prefix}-${++seq}`;

  return {
    user: {
      findUnique({ where }) {
        const match = users.find(
          (u) =>
            (where.id !== undefined && u.id === where.id) ||
            (where.email !== undefined && u.email === where.email) ||
            (where.googleId !== undefined && u.googleId === where.googleId),
        );
        return Promise.resolve(match ?? null);
      },
      create({ data }) {
        const user: StoredUser = {
          id: nextId('user'),
          email: data.email,
          name: data.name ?? null,
          avatarUrl: data.avatarUrl ?? null,
          locale: data.locale ?? null,
          role: null,
          onboardingCompleted: false,
          googleId: data.googleId ?? null,
          emailVerified: data.emailVerified ?? false,
          provider: data.provider ?? 'GOOGLE',
          deletedAt: null,
        };
        users.push(user);
        return Promise.resolve(user);
      },
      update({ where, data }) {
        const user = users.find((u) => u.id === where.id);
        if (!user) {
          return Promise.reject(new Error(`user ${where.id} not found`));
        }
        if (data.role !== undefined) user.role = data.role;
        if (data.onboardingCompleted !== undefined)
          user.onboardingCompleted = data.onboardingCompleted;
        if (data.name !== undefined) user.name = data.name;
        if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl;
        if (data.locale !== undefined) user.locale = data.locale;
        if (data.googleId !== undefined) user.googleId = data.googleId;
        return Promise.resolve(user);
      },
    },
    refreshToken: {
      create({ data }) {
        const record: StoredRefreshToken = {
          id: nextId('rt'),
          userId: data.userId,
          tokenHash: data.tokenHash,
          expiresAt: data.expiresAt,
          revokedAt: null,
        };
        refreshTokens.push(record);
        return Promise.resolve(record);
      },
      findUnique({ where }) {
        const match = refreshTokens.find((t) => t.tokenHash === where.tokenHash);
        return Promise.resolve(match ?? null);
      },
      update({ where, data }) {
        const record = refreshTokens.find((t) => t.id === where.id);
        if (!record) {
          return Promise.reject(new Error(`refreshToken ${where.id} not found`));
        }
        record.revokedAt = data.revokedAt;
        return Promise.resolve(record);
      },
      updateMany({ where, data }) {
        const targets = refreshTokens.filter(
          (t) =>
            t.revokedAt === null &&
            (where.tokenHash === undefined || t.tokenHash === where.tokenHash) &&
            (where.userId === undefined || t.userId === where.userId),
        );
        for (const t of targets) t.revokedAt = data.revokedAt;
        return Promise.resolve({ count: targets.length });
      },
    },
  };
}
