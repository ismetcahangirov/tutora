# Auth Wave 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a mobile client sign in with Google against `tutora-api` and receive an access JWT + an opaque refresh token, backed by a Prisma `User`/`RefreshToken` store.

**Architecture:** NestJS feature modules. A global `PrismaModule` exposes `PrismaService`. `auth` depends on `users`. `POST /api/v1/auth/google` verifies a Google `idToken` (`google-auth-library`), provisions/links a `User`, and issues tokens: a signed access JWT (`@nestjs/jwt`) plus a random opaque refresh token stored as an HMAC-SHA256 hash (peppered with `JWT_REFRESH_SECRET`).

**Tech Stack:** NestJS 11, Prisma + PostgreSQL, `@nestjs/jwt`, `google-auth-library`, `class-validator`/`class-transformer`, Jest.

**Spec:** `docs/superpowers/specs/2026-07-11-auth-wave1-design.md`

---

## Conventions for every task

- Run all commands from the repo root `C:\Users\cahan\projects\tutora` unless stated otherwise.
- Workspace filter: the API package is `@tutora/api`. Install deps with `pnpm --filter @tutora/api add <pkg>`.
- Run a single test file by pattern: `pnpm --filter @tutora/api exec jest <pattern>`.
- Run the whole API suite: `pnpm --filter @tutora/api test`.
- Path aliases (tsconfig + jest both configured): `@/*`→`src/*`, `@modules/*`, `@common/*`, `@config/*`.
- TDD: write the failing test, watch it fail, implement minimally, watch it pass, commit.

---

## File structure (created/modified in this plan)

```
apps/tutora-api/
  package.json                                    (modify: deps + prisma scripts)
  .env                                            (create locally, gitignored)
  .env.example                                    (modify: GOOGLE_CLIENT_ID)
  prisma/
    schema.prisma                                 (create)
    migrations/                                   (created by prisma migrate)
  src/
    main.ts                                        (modify: prefix, versioning, ValidationPipe)
    app.module.ts                                  (modify: import PrismaModule, AuthModule)
    config/env.ts                                  (modify: GOOGLE_CLIENT_ID)
    config/env.spec.ts                             (modify: GOOGLE_CLIENT_ID test)
    prisma/
      prisma.service.ts                            (create)
      prisma.service.spec.ts                       (create)
      prisma.module.ts                             (create)
    common/utils/
      parse-duration.ts                            (create)
      parse-duration.spec.ts                       (create)
    modules/
      users/
        users.types.ts                             (create: GoogleProfile)
        users.service.ts                           (create)
        users.service.spec.ts                      (create)
        users.module.ts                            (create)
      auth/
        types/auth.types.ts                        (create: AuthTokens, AuthResponse)
        dto/google-auth.dto.ts                     (create)
        dto/google-auth.dto.spec.ts                (create)
        services/
          google-verifier.service.ts              (create)
          google-verifier.service.spec.ts         (create)
          token.service.ts                         (create)
          token.service.spec.ts                    (create)
        auth.service.ts                            (create)
        auth.service.spec.ts                       (create)
        auth.controller.ts                         (create)
        auth.controller.spec.ts                    (create)
        auth.module.ts                             (create)
        auth.integration.spec.ts                   (create)
```

Root `.env.example` is also modified (add `GOOGLE_CLIENT_ID`).

---

## Task 1: Dependencies, Prisma schema, and client generation

**Files:**

- Modify: `apps/tutora-api/package.json` (deps + scripts)
- Create: `apps/tutora-api/prisma/schema.prisma`
- Create: `apps/tutora-api/.env` (local, gitignored — not committed)
- Modify: `apps/tutora-api/.env.example`
- Modify: `.env.example` (root)

- [ ] **Step 1: Install runtime + dev dependencies**

```bash
pnpm --filter @tutora/api add @prisma/client @nestjs/jwt google-auth-library class-validator class-transformer
pnpm --filter @tutora/api add -D prisma
```

- [ ] **Step 2: Add Prisma scripts to `apps/tutora-api/package.json`**

In the `"scripts"` block, add these three entries (leave the existing scripts untouched):

```json
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
```

- [ ] **Step 3: Create the Prisma schema**

Create `apps/tutora-api/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  STUDENT
  TUTOR
  ADMIN
}

enum AuthProvider {
  GOOGLE
}

model User {
  id                  String         @id @default(cuid())
  email               String         @unique
  emailVerified       Boolean        @default(false)
  name                String?
  avatarUrl           String?
  locale              String?
  provider            AuthProvider   @default(GOOGLE)
  googleId            String?        @unique
  role                UserRole?
  onboardingCompleted Boolean        @default(false)
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt
  refreshTokens       RefreshToken[]
}

model RefreshToken {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String    @unique
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime  @default(now())

  @@index([userId])
  @@index([expiresAt])
}
```

- [ ] **Step 4: Create the local `.env` for the API (gitignored)**

Create `apps/tutora-api/.env` (Prisma reads this at migrate time; it is ignored by `.gitignore`):

```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://tutora:tutora@localhost:5432/tutora
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=dev-access-secret-change-me-please
JWT_REFRESH_SECRET=dev-refresh-secret-change-me-please
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=dev-google-client-id.apps.googleusercontent.com
```

- [ ] **Step 5: Add `GOOGLE_CLIENT_ID` to both `.env.example` files**

In `apps/tutora-api/.env.example`, append after the JWT block:

```
# Google OAuth — the client ID the mobile app's idToken is issued for.
# NOTE: JWT_REFRESH_SECRET above also serves as the HMAC pepper for stored refresh tokens.
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

In the root `.env.example`, add the same `GOOGLE_CLIENT_ID=` line inside the API section (right after `JWT_REFRESH_EXPIRES_IN=7d`).

- [ ] **Step 6: Generate the Prisma client**

```bash
pnpm --filter @tutora/api exec prisma generate
```

Expected: `Generated Prisma Client ...` with no errors. This makes `@prisma/client` types available for later tasks.

- [ ] **Step 7: Create the initial migration (requires Docker Postgres running)**

Start the database first (start Docker Desktop manually if it is not running):

```bash
pnpm db:up
pnpm --filter @tutora/api exec prisma migrate dev --name init_auth
```

Expected: a new folder `apps/tutora-api/prisma/migrations/<timestamp>_init_auth/` containing `migration.sql`, and `Your database is now in sync with your schema.`

- [ ] **Step 8: Commit**

```bash
git add apps/tutora-api/package.json apps/tutora-api/prisma apps/tutora-api/.env.example .env.example pnpm-lock.yaml
git commit -m "feat(api): add prisma with User and RefreshToken models"
```

> `apps/tutora-api/.env` is intentionally NOT staged (gitignored). The generated client lives under `node_modules` and is not committed.

---

## Task 2: PrismaService + PrismaModule

**Files:**

- Create: `apps/tutora-api/src/prisma/prisma.service.ts`
- Test: `apps/tutora-api/src/prisma/prisma.service.spec.ts`
- Create: `apps/tutora-api/src/prisma/prisma.module.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/tutora-api/src/prisma/prisma.service.spec.ts`:

```ts
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('connects on module init', async () => {
    const service = new PrismaService();
    const connect = jest.spyOn(service, '$connect').mockResolvedValue(undefined);

    await service.onModuleInit();

    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('disconnects on module destroy', async () => {
    const service = new PrismaService();
    const disconnect = jest.spyOn(service, '$disconnect').mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tutora/api exec jest prisma.service`
Expected: FAIL — cannot find module `./prisma.service`.

- [ ] **Step 3: Write the service**

Create `apps/tutora-api/src/prisma/prisma.service.ts`:

```ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Prisma connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @tutora/api exec jest prisma.service`
Expected: PASS (2 tests).

- [ ] **Step 5: Create the module**

Create `apps/tutora-api/src/prisma/prisma.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 6: Commit**

```bash
git add apps/tutora-api/src/prisma
git commit -m "feat(api): add global PrismaService and PrismaModule"
```

---

## Task 3: `parseDuration` utility

**Files:**

- Create: `apps/tutora-api/src/common/utils/parse-duration.ts`
- Test: `apps/tutora-api/src/common/utils/parse-duration.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/tutora-api/src/common/utils/parse-duration.spec.ts`:

```ts
import { parseDuration } from './parse-duration';

describe('parseDuration', () => {
  it.each([
    ['30s', 30_000],
    ['15m', 900_000],
    ['1h', 3_600_000],
    ['7d', 604_800_000],
    ['250ms', 250],
  ])('parses %s to %d ms', (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });

  it.each(['', '10', 'm', '10x', '1.5h', '-5m'])('throws on invalid input %s', (input) => {
    expect(() => parseDuration(input)).toThrow(/Invalid duration/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tutora/api exec jest parse-duration`
Expected: FAIL — cannot find module `./parse-duration`.

- [ ] **Step 3: Write the implementation**

Create `apps/tutora-api/src/common/utils/parse-duration.ts`:

```ts
const UNIT_TO_MS: Record<string, number> = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/**
 * Converts a duration string like '15m' or '7d' into milliseconds.
 * Supported units: ms, s, m, h, d. Throws on any other format.
 */
export function parseDuration(value: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid duration: "${value}"`);
  }
  const [, amount, unit] = match;
  return Number(amount) * UNIT_TO_MS[unit];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @tutora/api exec jest parse-duration`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add apps/tutora-api/src/common/utils/parse-duration.ts apps/tutora-api/src/common/utils/parse-duration.spec.ts
git commit -m "feat(api): add parseDuration helper for token TTLs"
```

---

## Task 4: Add `GOOGLE_CLIENT_ID` to env validation

**Files:**

- Modify: `apps/tutora-api/src/config/env.ts`
- Test: `apps/tutora-api/src/config/env.spec.ts`

- [ ] **Step 1: Extend the failing test**

In `apps/tutora-api/src/config/env.spec.ts`, add `GOOGLE_CLIENT_ID` to the `validEnv` object and a new test. The updated `validEnv` and new test:

```ts
const validEnv = {
  DATABASE_URL: 'postgresql://tutora:tutora@localhost:5432/tutora',
  REDIS_URL: 'redis://localhost:6379',
  JWT_ACCESS_SECRET: 'a-sufficiently-long-access-secret',
  JWT_REFRESH_SECRET: 'a-sufficiently-long-refresh-secret',
  GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com',
};
```

Add this test inside the `describe('validateEnv', ...)` block:

```ts
it('requires GOOGLE_CLIENT_ID', () => {
  const withoutGoogle = {
    DATABASE_URL: validEnv.DATABASE_URL,
    REDIS_URL: validEnv.REDIS_URL,
    JWT_ACCESS_SECRET: validEnv.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: validEnv.JWT_REFRESH_SECRET,
  };
  expect(() => validateEnv(withoutGoogle)).toThrow(/GOOGLE_CLIENT_ID/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tutora/api exec jest env.spec`
Expected: FAIL — `validateEnv` does not yet require `GOOGLE_CLIENT_ID` (the new test throws no error, or existing tests break because the schema strips the unknown key).

- [ ] **Step 3: Add the field to the schema**

In `apps/tutora-api/src/config/env.ts`, inside `envSchema`, add after the JWT block (before the closing `});`):

```ts
  // Google OAuth — audience the mobile idToken is verified against.
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @tutora/api exec jest env.spec`
Expected: PASS (all env tests).

- [ ] **Step 5: Commit**

```bash
git add apps/tutora-api/src/config/env.ts apps/tutora-api/src/config/env.spec.ts
git commit -m "feat(api): validate GOOGLE_CLIENT_ID at startup"
```

---

## Task 5: UsersService + GoogleProfile type + UsersModule

**Files:**

- Create: `apps/tutora-api/src/modules/users/users.types.ts`
- Create: `apps/tutora-api/src/modules/users/users.service.ts`
- Test: `apps/tutora-api/src/modules/users/users.service.spec.ts`
- Create: `apps/tutora-api/src/modules/users/users.module.ts`

- [ ] **Step 1: Create the shared profile type**

Create `apps/tutora-api/src/modules/users/users.types.ts`:

```ts
/**
 * Normalized Google profile extracted from a verified idToken.
 * Produced by the auth GoogleVerifierService, consumed by UsersService.
 */
export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
  locale?: string;
}
```

- [ ] **Step 2: Write the failing test**

Create `apps/tutora-api/src/modules/users/users.service.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { UsersService } from './users.service';
import type { GoogleProfile } from './users.types';

const profile: GoogleProfile = {
  googleId: 'google-sub-123',
  email: 'ada@example.com',
  emailVerified: true,
  name: 'Ada Lovelace',
  picture: 'https://img/avatar.png',
  locale: 'en',
};

function buildPrismaMock() {
  return {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };
}

async function buildService(prisma: ReturnType<typeof buildPrismaMock>) {
  const moduleRef = await Test.createTestingModule({
    providers: [UsersService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return moduleRef.get(UsersService);
}

describe('UsersService.upsertFromGoogle', () => {
  it('returns the existing user when found by googleId', async () => {
    const prisma = buildPrismaMock();
    const existing = { id: 'u1', email: profile.email, googleId: profile.googleId };
    prisma.user.findUnique.mockResolvedValueOnce(existing);

    const service = await buildService(prisma);
    const result = await service.upsertFromGoogle(profile);

    expect(result).toBe(existing);
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('links googleId to an existing user found by email', async () => {
    const prisma = buildPrismaMock();
    const byEmail = { id: 'u2', email: profile.email, googleId: null, name: null, avatarUrl: null };
    prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(byEmail);
    prisma.user.update.mockResolvedValueOnce({ ...byEmail, googleId: profile.googleId });

    const service = await buildService(prisma);
    const result = await service.upsertFromGoogle(profile);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u2' },
      data: { googleId: profile.googleId, name: profile.name, avatarUrl: profile.picture },
    });
    expect(result.googleId).toBe(profile.googleId);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('creates a new user with null role when none exists', async () => {
    const prisma = buildPrismaMock();
    prisma.user.findUnique.mockResolvedValue(null);
    const created = { id: 'u3', email: profile.email, role: null, onboardingCompleted: false };
    prisma.user.create.mockResolvedValueOnce(created);

    const service = await buildService(prisma);
    const result = await service.upsertFromGoogle(profile);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: profile.email,
        emailVerified: true,
        googleId: profile.googleId,
        name: profile.name,
        avatarUrl: profile.picture,
        locale: profile.locale,
        provider: 'GOOGLE',
      },
    });
    expect(result).toBe(created);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @tutora/api exec jest users.service`
Expected: FAIL — cannot find module `./users.service`.

- [ ] **Step 4: Write the service**

Create `apps/tutora-api/src/modules/users/users.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { GoogleProfile } from './users.types';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds a user by Google id, links Google to an existing email account, or
   * creates a fresh account. New accounts have no role until onboarding (#23).
   */
  async upsertFromGoogle(profile: GoogleProfile): Promise<User> {
    const byGoogleId = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });
    if (byGoogleId) {
      return byGoogleId;
    }

    const byEmail = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });
    if (byEmail) {
      return this.prisma.user.update({
        where: { id: byEmail.id },
        data: {
          googleId: profile.googleId,
          name: byEmail.name ?? profile.name,
          avatarUrl: byEmail.avatarUrl ?? profile.picture,
        },
      });
    }

    return this.prisma.user.create({
      data: {
        email: profile.email,
        emailVerified: true,
        googleId: profile.googleId,
        name: profile.name,
        avatarUrl: profile.picture,
        locale: profile.locale,
        provider: 'GOOGLE',
      },
    });
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @tutora/api exec jest users.service`
Expected: PASS (3 tests).

> Note: the `link by email` test uses `name: profile.name` because `byEmail.name` is `null` (`null ?? profile.name` → `profile.name`).

- [ ] **Step 6: Create the module**

Create `apps/tutora-api/src/modules/users/users.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

- [ ] **Step 7: Commit**

```bash
git add apps/tutora-api/src/modules/users
git commit -m "feat(api): add UsersService.upsertFromGoogle provisioning"
```

---

## Task 6: GoogleVerifierService

**Files:**

- Create: `apps/tutora-api/src/modules/auth/services/google-verifier.service.ts`
- Test: `apps/tutora-api/src/modules/auth/services/google-verifier.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/tutora-api/src/modules/auth/services/google-verifier.service.spec.ts`:

```ts
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { GoogleVerifierService } from './google-verifier.service';

jest.mock('google-auth-library');

const MockedOAuth2Client = OAuth2Client as jest.MockedClass<typeof OAuth2Client>;

function verifyIdTokenReturning(payload: Record<string, unknown> | undefined) {
  MockedOAuth2Client.prototype.verifyIdToken = jest
    .fn()
    .mockResolvedValue({ getPayload: () => payload });
}

function buildService(): GoogleVerifierService {
  const config = { getOrThrow: jest.fn().mockReturnValue('client-id') } as unknown as ConfigService;
  return new GoogleVerifierService(config);
}

describe('GoogleVerifierService.verify', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a normalized profile for a valid token', async () => {
    verifyIdTokenReturning({
      sub: 'google-sub-1',
      email: 'ada@example.com',
      email_verified: true,
      name: 'Ada',
      picture: 'https://img/a.png',
      locale: 'en',
    });

    const profile = await buildService().verify('good-token');

    expect(profile).toEqual({
      googleId: 'google-sub-1',
      email: 'ada@example.com',
      emailVerified: true,
      name: 'Ada',
      picture: 'https://img/a.png',
      locale: 'en',
    });
  });

  it('throws Unauthorized when the library rejects the token', async () => {
    MockedOAuth2Client.prototype.verifyIdToken = jest.fn().mockRejectedValue(new Error('bad'));
    await expect(buildService().verify('bad-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws Unauthorized when email is not verified', async () => {
    verifyIdTokenReturning({ sub: 's', email: 'x@example.com', email_verified: false });
    await expect(buildService().verify('token')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tutora/api exec jest google-verifier`
Expected: FAIL — cannot find module `./google-verifier.service`.

- [ ] **Step 3: Write the service**

Create `apps/tutora-api/src/modules/auth/services/google-verifier.service.ts`:

```ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import type { GoogleProfile } from '@modules/users/users.types';

@Injectable()
export class GoogleVerifierService {
  private readonly client = new OAuth2Client();
  private readonly audience: string;

  constructor(private readonly config: ConfigService) {
    this.audience = this.config.getOrThrow<string>('GOOGLE_CLIENT_ID');
  }

  async verify(idToken: string): Promise<GoogleProfile> {
    let payload: TokenPayload | undefined;
    try {
      const ticket = await this.client.verifyIdToken({ idToken, audience: this.audience });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    if (!payload?.email || payload.email_verified !== true) {
      throw new UnauthorizedException('Google account email is not verified');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      emailVerified: true,
      name: payload.name,
      picture: payload.picture,
      locale: payload.locale,
    };
  }
}
```

> Never log `idToken` or `payload` — they carry identity claims.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @tutora/api exec jest google-verifier`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/tutora-api/src/modules/auth/services/google-verifier.service.ts apps/tutora-api/src/modules/auth/services/google-verifier.service.spec.ts
git commit -m "feat(api): verify Google idToken and normalize profile"
```

---

## Task 7: Auth token types + TokenService

**Files:**

- Create: `apps/tutora-api/src/modules/auth/types/auth.types.ts`
- Create: `apps/tutora-api/src/modules/auth/services/token.service.ts`
- Test: `apps/tutora-api/src/modules/auth/services/token.service.spec.ts`

- [ ] **Step 1: Create the token/response types**

Create `apps/tutora-api/src/modules/auth/types/auth.types.ts`:

```ts
import type { UserRole } from '@prisma/client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUserSummary {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole | null;
  onboardingCompleted: boolean;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUserSummary;
}
```

- [ ] **Step 2: Write the failing test**

Create `apps/tutora-api/src/modules/auth/services/token.service.spec.ts`:

```ts
import { createHmac } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { TokenService } from './token.service';
import type { User } from '@prisma/client';

const CONFIG: Record<string, string> = {
  JWT_ACCESS_SECRET: 'access-secret',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'refresh-secret',
  JWT_REFRESH_EXPIRES_IN: '7d',
};

const user = {
  id: 'user-1',
  email: 'ada@example.com',
  role: null,
  onboardingCompleted: false,
} as unknown as User;

function build() {
  const jwt = { signAsync: jest.fn().mockResolvedValue('signed.access.jwt') };
  const config = { getOrThrow: jest.fn((key: string) => CONFIG[key]) };
  const prisma = { refreshToken: { create: jest.fn().mockResolvedValue({}) } };
  const service = new TokenService(
    jwt as unknown as JwtService,
    config as unknown as ConfigService,
    prisma as unknown as PrismaService,
  );
  return { service, jwt, prisma };
}

describe('TokenService.issueTokens', () => {
  it('signs an access token with the user claims', async () => {
    const { service, jwt } = build();
    await service.issueTokens(user);

    expect(jwt.signAsync).toHaveBeenCalledWith(
      { sub: 'user-1', email: 'ada@example.com', role: null, onboardingCompleted: false },
      { secret: 'access-secret', expiresIn: '15m' },
    );
  });

  it('persists the refresh token only as an HMAC hash, never in plaintext', async () => {
    const { service, prisma } = build();
    const { refreshToken } = await service.issueTokens(user);

    const createArg = prisma.refreshToken.create.mock.calls[0][0].data;
    const expectedHash = createHmac('sha256', 'refresh-secret').update(refreshToken).digest('hex');

    expect(createArg.userId).toBe('user-1');
    expect(createArg.tokenHash).toBe(expectedHash);
    expect(createArg.tokenHash).not.toBe(refreshToken);
    expect(createArg.expiresAt).toBeInstanceOf(Date);
    expect(createArg.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('returns the signed access token and a non-empty opaque refresh token', async () => {
    const { service } = build();
    const tokens = await service.issueTokens(user);

    expect(tokens.accessToken).toBe('signed.access.jwt');
    expect(typeof tokens.refreshToken).toBe('string');
    expect(tokens.refreshToken.length).toBeGreaterThan(20);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @tutora/api exec jest token.service`
Expected: FAIL — cannot find module `./token.service`.

- [ ] **Step 4: Write the service**

Create `apps/tutora-api/src/modules/auth/services/token.service.ts`:

```ts
import { createHmac, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { parseDuration } from '@common/utils/parse-duration';
import type { AuthTokens } from '../types/auth.types';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Mints a short-lived access JWT plus an opaque refresh token. The refresh
   * token is returned to the caller once and stored only as an HMAC hash.
   */
  async issueTokens(user: User): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted,
      },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN'),
      },
    );

    const refreshToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() + parseDuration(this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN')),
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashRefreshToken(refreshToken),
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private hashRefreshToken(token: string): string {
    return createHmac('sha256', this.config.getOrThrow<string>('JWT_REFRESH_SECRET'))
      .update(token)
      .digest('hex');
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @tutora/api exec jest token.service`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/tutora-api/src/modules/auth/types apps/tutora-api/src/modules/auth/services/token.service.ts apps/tutora-api/src/modules/auth/services/token.service.spec.ts
git commit -m "feat(api): issue access JWT and hashed opaque refresh token"
```

---

## Task 8: GoogleAuthDto

**Files:**

- Create: `apps/tutora-api/src/modules/auth/dto/google-auth.dto.ts`
- Test: `apps/tutora-api/src/modules/auth/dto/google-auth.dto.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/tutora-api/src/modules/auth/dto/google-auth.dto.spec.ts`:

```ts
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { GoogleAuthDto } from './google-auth.dto';

function validate(payload: unknown) {
  return validateSync(plainToInstance(GoogleAuthDto, payload));
}

describe('GoogleAuthDto', () => {
  it('accepts a non-empty idToken', () => {
    expect(validate({ idToken: 'abc.def.ghi' })).toHaveLength(0);
  });

  it.each([{}, { idToken: '' }, { idToken: 123 }])('rejects invalid payload %o', (payload) => {
    expect(validate(payload).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tutora/api exec jest google-auth.dto`
Expected: FAIL — cannot find module `./google-auth.dto`.

- [ ] **Step 3: Write the DTO**

Create `apps/tutora-api/src/modules/auth/dto/google-auth.dto.ts`:

```ts
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @tutora/api exec jest google-auth.dto`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add apps/tutora-api/src/modules/auth/dto
git commit -m "feat(api): add GoogleAuthDto with idToken validation"
```

---

## Task 9: AuthService (orchestration)

**Files:**

- Create: `apps/tutora-api/src/modules/auth/auth.service.ts`
- Test: `apps/tutora-api/src/modules/auth/auth.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/tutora-api/src/modules/auth/auth.service.spec.ts`:

```ts
import { UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@modules/users/users.service';
import { AuthService } from './auth.service';
import { GoogleVerifierService } from './services/google-verifier.service';
import { TokenService } from './services/token.service';

const profile = { googleId: 'g1', email: 'ada@example.com', emailVerified: true, name: 'Ada' };
const user = {
  id: 'u1',
  email: 'ada@example.com',
  name: 'Ada',
  avatarUrl: null,
  role: null,
  onboardingCompleted: false,
};

function build() {
  const verifier = { verify: jest.fn().mockResolvedValue(profile) };
  const users = { upsertFromGoogle: jest.fn().mockResolvedValue(user) };
  const tokens = {
    issueTokens: jest.fn().mockResolvedValue({ accessToken: 'acc', refreshToken: 'ref' }),
  };
  const service = new AuthService(
    verifier as unknown as GoogleVerifierService,
    users as unknown as UsersService,
    tokens as unknown as TokenService,
  );
  return { service, verifier, users, tokens };
}

describe('AuthService.authenticateWithGoogle', () => {
  it('verifies, provisions, issues, and shapes the response', async () => {
    const { service, verifier, users, tokens } = build();

    const result = await service.authenticateWithGoogle('id-token');

    expect(verifier.verify).toHaveBeenCalledWith('id-token');
    expect(users.upsertFromGoogle).toHaveBeenCalledWith(profile);
    expect(tokens.issueTokens).toHaveBeenCalledWith(user);
    expect(result).toEqual({
      accessToken: 'acc',
      refreshToken: 'ref',
      user: {
        id: 'u1',
        email: 'ada@example.com',
        name: 'Ada',
        avatarUrl: null,
        role: null,
        onboardingCompleted: false,
      },
    });
  });

  it('propagates a verification failure and never provisions', async () => {
    const { service, verifier, users } = build();
    verifier.verify.mockRejectedValueOnce(new UnauthorizedException());

    await expect(service.authenticateWithGoogle('bad')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(users.upsertFromGoogle).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tutora/api exec jest auth.service`
Expected: FAIL — cannot find module `./auth.service`.

- [ ] **Step 3: Write the service**

Create `apps/tutora-api/src/modules/auth/auth.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { UsersService } from '@modules/users/users.service';
import { GoogleVerifierService } from './services/google-verifier.service';
import { TokenService } from './services/token.service';
import type { AuthResponse } from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly googleVerifier: GoogleVerifierService,
    private readonly users: UsersService,
    private readonly tokens: TokenService,
  ) {}

  async authenticateWithGoogle(idToken: string): Promise<AuthResponse> {
    const profile = await this.googleVerifier.verify(idToken);
    const user = await this.users.upsertFromGoogle(profile);
    const { accessToken, refreshToken } = await this.tokens.issueTokens(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted,
      },
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @tutora/api exec jest auth.service`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/tutora-api/src/modules/auth/auth.service.ts apps/tutora-api/src/modules/auth/auth.service.spec.ts
git commit -m "feat(api): orchestrate Google sign-in in AuthService"
```

---

## Task 10: AuthController

**Files:**

- Create: `apps/tutora-api/src/modules/auth/auth.controller.ts`
- Test: `apps/tutora-api/src/modules/auth/auth.controller.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/tutora-api/src/modules/auth/auth.controller.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  it('delegates POST /auth/google to AuthService', async () => {
    const response = { accessToken: 'acc', refreshToken: 'ref', user: { id: 'u1' } };
    const authService = { authenticateWithGoogle: jest.fn().mockResolvedValue(response) };

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    const controller = moduleRef.get(AuthController);
    const result = await controller.google({ idToken: 'id-token' });

    expect(authService.authenticateWithGoogle).toHaveBeenCalledWith('id-token');
    expect(result).toBe(response);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tutora/api exec jest auth.controller`
Expected: FAIL — cannot find module `./auth.controller`.

- [ ] **Step 3: Write the controller**

Create `apps/tutora-api/src/modules/auth/auth.controller.ts`:

```ts
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import type { AuthResponse } from './types/auth.types';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async google(@Body() dto: GoogleAuthDto): Promise<AuthResponse> {
    return this.authService.authenticateWithGoogle(dto.idToken);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @tutora/api exec jest auth.controller`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add apps/tutora-api/src/modules/auth/auth.controller.ts apps/tutora-api/src/modules/auth/auth.controller.spec.ts
git commit -m "feat(api): add POST /auth/google controller"
```

---

## Task 11: AuthModule + wire into AppModule

**Files:**

- Create: `apps/tutora-api/src/modules/auth/auth.module.ts`
- Modify: `apps/tutora-api/src/app.module.ts`

- [ ] **Step 1: Create the AuthModule**

Create `apps/tutora-api/src/modules/auth/auth.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '@modules/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleVerifierService } from './services/google-verifier.service';
import { TokenService } from './services/token.service';

@Module({
  imports: [UsersModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, GoogleVerifierService, TokenService],
})
export class AuthModule {}
```

> `JwtModule.register({})` provides `JwtService`; the signing secret and expiry are passed per-call in `TokenService`.

- [ ] **Step 2: Wire modules into AppModule**

Edit `apps/tutora-api/src/app.module.ts` to import `PrismaModule` and `AuthModule`. The full file:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv } from '@config/env';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- [ ] **Step 3: Verify the app compiles and the whole suite passes**

Run: `pnpm --filter @tutora/api typecheck`
Expected: no type errors.

Run: `pnpm --filter @tutora/api test`
Expected: all specs PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/tutora-api/src/modules/auth/auth.module.ts apps/tutora-api/src/app.module.ts
git commit -m "feat(api): wire AuthModule and PrismaModule into the app"
```

---

## Task 12: main.ts (global prefix, versioning, ValidationPipe) + route integration test

**Files:**

- Modify: `apps/tutora-api/src/main.ts`
- Test: `apps/tutora-api/src/modules/auth/auth.integration.spec.ts`

- [ ] **Step 1: Write the failing integration test**

Create `apps/tutora-api/src/modules/auth/auth.integration.spec.ts`:

```ts
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthModule } from './auth.module';
import { GoogleVerifierService } from './services/google-verifier.service';

const ENV = {
  JWT_ACCESS_SECRET: 'access-secret-for-tests',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'refresh-secret-for-tests',
  JWT_REFRESH_EXPIRES_IN: '7d',
  GOOGLE_CLIENT_ID: 'client-id',
};

const fakeUser = {
  id: 'user-1',
  email: 'ada@example.com',
  name: 'Ada',
  avatarUrl: null,
  role: null,
  onboardingCompleted: false,
};

describe('POST /api/v1/auth/google (integration)', () => {
  let app: INestApplication;

  const prismaMock = {
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(fakeUser),
    },
    refreshToken: { create: jest.fn().mockResolvedValue({}) },
  };
  const verifierMock = {
    verify: jest.fn().mockResolvedValue({
      googleId: 'g1',
      email: 'ada@example.com',
      emailVerified: true,
      name: 'Ada',
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, load: [() => ENV] }), AuthModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(GoogleVerifierService)
      .useValue(verifierMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 with tokens and user for a valid idToken', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/google')
      .send({ idToken: 'valid-id-token' })
      .expect(200);

    expect(typeof res.body.accessToken).toBe('string');
    expect(typeof res.body.refreshToken).toBe('string');
    expect(res.body.user).toMatchObject({ id: 'user-1', email: 'ada@example.com', role: null });
    expect(prismaMock.refreshToken.create).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when idToken is missing', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/google').send({}).expect(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tutora/api exec jest auth.integration`
Expected: FAIL — the route is not reachable at `/api/v1/...` yet because `main.ts` wiring is only replicated in the test; this test passes once the app config below is in place. (If it already passes because the test self-configures the app, proceed — the point of Step 3 is to make production `main.ts` match.)

- [ ] **Step 3: Update `main.ts` to match**

Edit `apps/tutora-api/src/main.ts`. The full file:

```ts
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appConfig } from '@config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`${appConfig.name} running on port ${port}`, 'Bootstrap');
}
void bootstrap();
```

- [ ] **Step 4: Run the integration test and the full suite**

Run: `pnpm --filter @tutora/api exec jest auth.integration`
Expected: PASS (2 tests).

Run: `pnpm --filter @tutora/api test`
Expected: entire suite PASS.

- [ ] **Step 5: Typecheck, lint, format**

```bash
pnpm --filter @tutora/api typecheck
pnpm --filter @tutora/api lint
pnpm --filter @tutora/api exec prettier --check "src/**/*.ts"
```

Expected: all clean (no errors/warnings). If prettier reports files, run it with `--write` and restage.

- [ ] **Step 6: Commit**

```bash
git add apps/tutora-api/src/main.ts apps/tutora-api/src/modules/auth/auth.integration.spec.ts
git commit -m "feat(api): expose /api/v1/auth/google with global validation"
```

---

## Task 13: Manual end-to-end verification & PR

**Files:** none (verification only)

- [ ] **Step 1: Boot the API against the docker database**

```bash
pnpm db:up
pnpm --filter @tutora/api dev
```

Expected: `Tutora API running on port 3000`, no env validation errors (confirms `GOOGLE_CLIENT_ID` is set in `apps/tutora-api/.env`).

- [ ] **Step 2: Verify rejection of a bogus token**

```bash
curl -i -X POST http://localhost:3000/api/v1/auth/google -H "Content-Type: application/json" -d "{\"idToken\":\"not-a-real-token\"}"
```

Expected: `HTTP/1.1 401 Unauthorized` (Google verification fails). A missing body returns `400`.

- [ ] **Step 3: (Optional) Verify a real sign-in**

With a genuine Google `idToken` (audience = `GOOGLE_CLIENT_ID`), the same `curl` returns `200` with `accessToken`, `refreshToken`, and `user`. Confirm a `User` row and a `RefreshToken` row exist:

```bash
pnpm --filter @tutora/api exec prisma studio
```

- [ ] **Step 4: Open the PR**

```bash
git push -u origin feature/auth-google-oauth-jwt
gh pr create --fill --base main
```

In the PR body use the template, link the issues (`Closes #18`, `Closes #19`), and note that Prisma foundation + `/api/v1/auth/google` are delivered while `/auth/refresh` (rotation) is deferred to #20 and guards to #21.

---

## Self-review checklist (run before starting execution)

- **Spec coverage:** Prisma foundation → Task 1–2; #18 Google verify + provision → Task 5, 6, 9, 10; #19 issuance → Task 7; env → Task 4; routing/validation → Task 12; DoD (typecheck/lint/format/tests) → Task 11–12; manual E2E + PR → Task 13. All spec sections covered.
- **Out-of-scope guardrails:** no `/auth/refresh`, no guards, no logout/blacklist, no password auth — none appear in any task.
- **Type consistency:** `GoogleProfile` (users.types) is produced by the verifier and consumed by users; `AuthTokens`/`AuthResponse`/`AuthUserSummary` (auth.types) flow verifier→service→controller unchanged; `upsertFromGoogle`, `issueTokens`, `verify`, `authenticateWithGoogle` names match across tests and implementations.
- **Secrets:** `JWT_REFRESH_SECRET` used only as HMAC pepper; refresh stored hashed (regression test in Task 7); no token/`idToken` logged.

```

```
