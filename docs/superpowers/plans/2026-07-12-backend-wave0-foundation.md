# Backend Wave 0 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the `tutora-api` scaffold (Swagger `/docs`, global catch-all exception filter, health endpoint) and lay down the full marketplace Prisma data model in a single migration.

**Architecture:** The NestJS app already exists (auth + i18n epics). We add: (1) a Swagger config helper wired into `main.ts`; (2) an `AllExceptionsFilter` that maps every non-validation error to the standard envelope, registered after the existing specific i18n validation filter; (3) a `HealthModule` replacing the placeholder `AppController`; (4) an expanded `schema.prisma` with taxonomy, profiles, marketplace, and lean chat/payments models, one migration, and an idempotent seed.

**Tech Stack:** NestJS 11 · `@nestjs/swagger` · Prisma 6 / PostgreSQL · Jest (Prisma mocked) · pnpm workspaces · ts-node (seed).

**Spec:** `docs/superpowers/specs/2026-07-12-backend-wave0-design.md`

**Conventions for every command below:**

- Run from repo root `C:\Users\cahan\projects\tutora` unless stated.
- API tests: `pnpm --filter @tutora/api test`.
- The API package name is `@tutora/api`; path aliases: `@/` → `src/`, `@common/` → `src/common/`, `@config/` → `src/config/`, `@modules/` → `src/modules/`.

---

## Task 1: Add the `@nestjs/swagger` dependency

**Files:**

- Modify: `apps/tutora-api/package.json` (dependencies)

- [ ] **Step 1: Install the package**

Run:

```bash
pnpm --filter @tutora/api add @nestjs/swagger
```

Expected: `@nestjs/swagger` appears under `dependencies` in `apps/tutora-api/package.json`; `pnpm-lock.yaml` updates. No peer-dependency errors (it targets `@nestjs/common@^11`, which is present).

- [ ] **Step 2: Verify it resolves**

Run:

```bash
pnpm --filter @tutora/api exec node -e "require('@nestjs/swagger'); console.log('swagger ok')"
```

Expected: prints `swagger ok`.

- [ ] **Step 3: Commit**

```bash
git add apps/tutora-api/package.json pnpm-lock.yaml
git commit -m "build(api): add @nestjs/swagger dependency (#26)"
```

---

## Task 2: Swagger config helper (TDD)

Build a pure `buildSwaggerConfig()` (unit-testable, no running server) plus a `setupSwagger()` that mounts `/docs`.

**Files:**

- Create: `apps/tutora-api/src/swagger.ts`
- Test: `apps/tutora-api/src/swagger.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/tutora-api/src/swagger.spec.ts`:

```ts
import { buildSwaggerConfig } from './swagger';

describe('buildSwaggerConfig', () => {
  it('sets the Tutora API title and the given version', () => {
    const config = buildSwaggerConfig('1.2.3');
    expect(config.info.title).toBe('Tutora API');
    expect(config.info.version).toBe('1.2.3');
  });

  it('registers a bearer auth security scheme named "bearer"', () => {
    const config = buildSwaggerConfig('0.0.1');
    expect(config.components?.securitySchemes?.bearer).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @tutora/api test -- swagger.spec.ts`
Expected: FAIL — `Cannot find module './swagger'`.

- [ ] **Step 3: Write the implementation**

Create `apps/tutora-api/src/swagger.ts`:

```ts
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

/** Path (after the global prefix is ignored by Swagger) where the docs UI is served. */
export const SWAGGER_PATH = 'docs';

/**
 * Builds the OpenAPI metadata document (everything except `paths`). Kept pure and
 * separate from `setupSwagger` so it can be unit-tested without booting an app.
 */
export function buildSwaggerConfig(version: string): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle('Tutora API')
    .setDescription('REST API powering the Tutora tutor-matching platform.')
    .setVersion(version)
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .build();
}

/** Generates the OpenAPI document from the app and mounts the Swagger UI at `/docs`. */
export function setupSwagger(app: INestApplication, version: string): void {
  const document = SwaggerModule.createDocument(app, buildSwaggerConfig(version));
  SwaggerModule.setup(SWAGGER_PATH, app, document);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @tutora/api test -- swagger.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/tutora-api/src/swagger.ts apps/tutora-api/src/swagger.spec.ts
git commit -m "feat(api): swagger config helper mounting /docs (#26)"
```

---

## Task 3: Global `AllExceptionsFilter` (TDD)

Catch-all filter that maps any non-validation error to the CLAUDE.md envelope. Validation errors stay owned by the existing `I18nValidationExceptionFilter` (registration order verified in Task 5).

**Files:**

- Create: `apps/tutora-api/src/common/filters/all-exceptions.filter.ts`
- Test: `apps/tutora-api/src/common/filters/all-exceptions.filter.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/tutora-api/src/common/filters/all-exceptions.filter.spec.ts`:

```ts
import { ArgumentsHost, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

interface CapturedResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

function createHost(url = '/api/v1/tutors/x'): {
  host: ArgumentsHost;
  getBody: () => CapturedResponse;
  getStatus: () => number;
} {
  let body!: CapturedResponse;
  let status!: number;
  const res = {
    status: (code: number) => {
      status = code;
      return res;
    },
    json: (payload: CapturedResponse) => {
      body = payload;
      return res;
    },
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => res,
      getRequest: () => ({ originalUrl: url }),
    }),
  } as unknown as ArgumentsHost;
  return { host, getBody: () => body, getStatus: () => status };
}

describe('AllExceptionsFilter', () => {
  it('maps an HttpException to the standard envelope', () => {
    const { host, getBody, getStatus } = createHost();
    new AllExceptionsFilter().catch(new NotFoundException('Tutor not found'), host);

    expect(getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(getBody()).toMatchObject({
      statusCode: 404,
      error: 'NotFound',
      message: 'Tutor not found',
      path: '/api/v1/tutors/x',
    });
    expect(typeof getBody().timestamp).toBe('string');
  });

  it('maps an unknown error to a safe 500 without leaking internals', () => {
    const { host, getBody, getStatus } = createHost('/api/v1/health');
    const logSpy = jest
      .spyOn(AllExceptionsFilter.prototype['logger'], 'error')
      .mockImplementation(() => undefined);

    new AllExceptionsFilter().catch(new Error('db connection string leaked'), host);

    expect(getStatus()).toBe(500);
    expect(getBody()).toMatchObject({
      statusCode: 500,
      error: 'InternalServerError',
      message: 'Internal server error',
      path: '/api/v1/health',
    });
    // The real error is logged with context but never returned to the client.
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('derives the error name from an HttpException status', () => {
    const { host, getBody } = createHost();
    new AllExceptionsFilter().catch(new HttpException('Nope', HttpStatus.BAD_REQUEST), host);
    expect(getBody().error).toBe('BadRequest');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @tutora/api test -- all-exceptions.filter.spec.ts`
Expected: FAIL — `Cannot find module './all-exceptions.filter'`.

- [ ] **Step 3: Write the implementation**

Create `apps/tutora-api/src/common/filters/all-exceptions.filter.ts`:

```ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/** The project's standard error envelope (see CLAUDE.md → Error Handling). */
interface ErrorEnvelope {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

/** Converts an HttpStatus code to a PascalCase name, e.g. 400 -> "BadRequest". */
function errorNameFromStatus(status: number): string {
  const key = HttpStatus[status] as string | undefined;
  if (!key) return 'Error';
  return key
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Catch-all exception filter. Localized validation errors are handled by the more
 * specific `I18nValidationExceptionFilter` (registered before this one), so they
 * never reach here. Everything else is shaped into the standard envelope; unknown
 * (non-HTTP) errors become a safe 500 and are logged with context — internals are
 * never leaked to the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      error = errorNameFromStatus(status);
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const shaped = body as { message?: string | string[]; error?: string };
        message = shaped.message ?? exception.message;
        if (shaped.error) error = shaped.error;
      }
    } else {
      // Unknown error: log the real cause, return a generic message.
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.originalUrl}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const envelope: ErrorEnvelope = {
      statusCode: status,
      error,
      message,
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    };
    response.status(status).json(envelope);
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @tutora/api test -- all-exceptions.filter.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/tutora-api/src/common/filters/all-exceptions.filter.ts apps/tutora-api/src/common/filters/all-exceptions.filter.spec.ts
git commit -m "feat(api): global AllExceptionsFilter with standard error envelope (#26)"
```

---

## Task 4: Health module, remove placeholder AppController (TDD)

**Files:**

- Create: `apps/tutora-api/src/modules/health/health.controller.ts`
- Create: `apps/tutora-api/src/modules/health/health.module.ts`
- Test: `apps/tutora-api/src/modules/health/health.controller.spec.ts`
- Delete: `apps/tutora-api/src/app.controller.ts`, `apps/tutora-api/src/app.service.ts`, `apps/tutora-api/src/app.controller.spec.ts`
- Modify: `apps/tutora-api/src/app.module.ts`
- Modify: `apps/tutora-api/test/app.e2e-spec.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/tutora-api/src/modules/health/health.controller.spec.ts`:

```ts
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns an ok status with a numeric uptime and ISO timestamp', () => {
    const result = new HealthController().check();
    expect(result.status).toBe('ok');
    expect(typeof result.uptime).toBe('number');
    expect(() => new Date(result.timestamp).toISOString()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @tutora/api test -- health.controller.spec.ts`
Expected: FAIL — `Cannot find module './health.controller'`.

- [ ] **Step 3: Write the health controller**

Create `apps/tutora-api/src/modules/health/health.controller.ts`:

```ts
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@modules/auth/decorators/public.decorator';

/** Shape returned by the liveness endpoint. */
export class HealthCheckResponse {
  status!: 'ok';
  uptime!: number;
  timestamp!: string;
}

@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  /**
   * Liveness probe for Docker/Nginx/monitoring. `@Public()` documents intent and
   * future-proofs the route against a global auth guard (none is applied today).
   */
  @Public()
  @Get()
  @ApiOkResponse({ type: HealthCheckResponse })
  check(): HealthCheckResponse {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
```

- [ ] **Step 4: Write the health module**

Create `apps/tutora-api/src/modules/health/health.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({ controllers: [HealthController] })
export class HealthModule {}
```

- [ ] **Step 5: Delete the placeholder scaffold files**

Run:

```bash
git rm apps/tutora-api/src/app.controller.ts apps/tutora-api/src/app.service.ts apps/tutora-api/src/app.controller.spec.ts
```

Expected: three files staged for deletion.

- [ ] **Step 6: Wire `HealthModule` into `AppModule`**

Replace the full contents of `apps/tutora-api/src/app.module.ts` with:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from '@config/env';
import { AppI18nModule } from '@/i18n/i18n.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';
import { MailModule } from '@modules/mail/mail.module';
import { UsersModule } from '@modules/users/users.module';
import { HealthModule } from '@modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    AppI18nModule,
    MailModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    HealthModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 7: Update the e2e test to hit the health route**

Replace the full contents of `apps/tutora-api/test/app.e2e-spec.ts` with:

```ts
import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Boots the real AppModule (connects Prisma) — requires the Postgres container up.
describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns ok', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((res) => {
        const body = res.body as { status?: string };
        if (body.status !== 'ok') throw new Error('health status not ok');
      });
  });
});
```

- [ ] **Step 8: Run the unit test suite**

Run: `pnpm --filter @tutora/api test`
Expected: PASS — health spec green; the deleted `app.controller.spec.ts` is gone; no other unit spec references `AppController`/`AppService`. (The e2e file is run separately via `test:e2e` and is not part of this command.)

- [ ] **Step 9: Commit**

```bash
git add apps/tutora-api/src/modules/health apps/tutora-api/src/app.module.ts apps/tutora-api/test/app.e2e-spec.ts
git commit -m "feat(api): health endpoint at /api/v1/health, drop placeholder AppController (#26)"
```

---

## Task 5: Wire Swagger + AllExceptionsFilter into `main.ts` and verify filter order

**Files:**

- Modify: `apps/tutora-api/src/main.ts`

- [ ] **Step 1: Update `main.ts`**

Replace the full contents of `apps/tutora-api/src/main.ts` with:

```ts
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { i18nValidationErrorFactory } from 'nestjs-i18n';
import { AppModule } from './app.module';
import { appConfig } from '@config/app.config';
import { createI18nValidationExceptionFilter } from '@common/filters/i18n-validation-exception.filter';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';
import { setupSwagger } from './swagger';

// Kept in sync with apps/tutora-api/package.json "version".
const API_VERSION = '0.0.1';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: i18nValidationErrorFactory,
    }),
  );
  // Order matters: the specific i18n validation filter is registered first so it
  // owns localized validation errors; the catch-all handles everything else.
  app.useGlobalFilters(createI18nValidationExceptionFilter(), new AllExceptionsFilter());

  setupSwagger(app, API_VERSION);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`${appConfig.name} running on port ${port}`, 'Bootstrap');
  Logger.log(`Swagger docs at http://localhost:${port}/docs`, 'Bootstrap');
}
void bootstrap();
```

- [ ] **Step 2: Verify validation errors are still localized (filter-order guard)**

Run: `pnpm --filter @tutora/api test -- i18n-validation.integration.spec.ts users.integration.spec.ts`
Expected: PASS. This proves the i18n validation filter still wins over the catch-all (validation errors keep their translated envelope, `PATCH /me` still returns 400 for bad roles).

> If these FAIL with a 500 or an untranslated message, the filter order is wrong for this Nest version. Remedy: swap the arguments so the catch-all is first —
> `app.useGlobalFilters(new AllExceptionsFilter(), createI18nValidationExceptionFilter());`
> — then re-run this step until green.

- [ ] **Step 3: Add Swagger tags to the existing controllers**

In `apps/tutora-api/src/modules/auth/auth.controller.ts`, add the import and class decorator:

```ts
import { ApiTags } from '@nestjs/swagger';
```

```ts
@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
```

In `apps/tutora-api/src/modules/users/users.controller.ts`, add the imports and class decorators (the whole controller is bearer-guarded):

```ts
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
```

```ts
@ApiTags('users')
@ApiBearerAuth('bearer')
@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard)
export class UsersController {
```

- [ ] **Step 4: Typecheck and full test suite**

Run: `pnpm --filter @tutora/api typecheck && pnpm --filter @tutora/api test`
Expected: typecheck clean; all unit/integration specs PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/tutora-api/src/main.ts apps/tutora-api/src/modules/auth/auth.controller.ts apps/tutora-api/src/modules/users/users.controller.ts
git commit -m "feat(api): mount swagger, register global exception filter, tag controllers (#26)"
```

---

## Task 6: Expand `schema.prisma` with the marketplace model

Replace the schema with the full model. No DB yet — this task ends at `prisma validate`.

**Files:**

- Modify: `apps/tutora-api/prisma/schema.prisma`

- [ ] **Step 1: Replace the schema**

Replace the full contents of `apps/tutora-api/prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ---------- Enums ----------

enum UserRole {
  STUDENT
  TUTOR
  ADMIN
}

enum AuthProvider {
  GOOGLE
}

enum LessonFormat {
  ONLINE
  AT_STUDENT_HOME
  AT_TUTOR_PLACE
}

enum EducationLevel {
  SCHOOL
  UNIVERSITY
  EXAM_PREP
  OTHER
}

enum VerificationStatus {
  UNVERIFIED
  PENDING
  VERIFIED
  REJECTED
}

enum CertificateStatus {
  PENDING
  VERIFIED
  REJECTED
}

enum ApplicationStatus {
  PENDING
  ACCEPTED
  DECLINED
  CANCELLED
  COMPLETED
  EXPIRED
}

enum ReviewStatus {
  PUBLISHED
  HIDDEN
  REMOVED
}

enum PlanTier {
  FREE
  PRO
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  EXPIRED
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  REFUNDED
}

// ---------- Identity ----------

model User {
  id                  String          @id @default(cuid())
  email               String          @unique
  emailVerified       Boolean         @default(false)
  name                String?
  avatarUrl           String?
  locale              String?
  provider            AuthProvider    @default(GOOGLE)
  googleId            String?         @unique
  role                UserRole?
  onboardingCompleted Boolean         @default(false)
  deletedAt           DateTime?
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  refreshTokens  RefreshToken[]
  tutorProfile   TutorProfile?
  studentProfile StudentProfile?
  chatMessages   ChatMessage[]
  subscriptions  Subscription[]
  payments       Payment[]
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

// ---------- Taxonomy ----------

model Category {
  id        String    @id @default(cuid())
  name      String
  slug      String    @unique
  subjects  Subject[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Subject {
  id            String         @id @default(cuid())
  name          String
  slug          String         @unique
  categoryId    String?
  category      Category?      @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  tutorSubjects TutorSubject[]
  applications  Application[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([categoryId])
}

model District {
  id             String          @id @default(cuid())
  name           String
  slug           String          @unique
  tutorDistricts TutorDistrict[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}

model Language {
  id             String          @id @default(cuid())
  name           String
  code           String          @unique
  tutorLanguages TutorLanguage[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}

// ---------- Profiles ----------

model TutorProfile {
  id                 String             @id @default(cuid())
  userId             String             @unique
  user               User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  bio                String?
  experienceYears    Int                @default(0)
  hourlyRate         Decimal            @db.Decimal(10, 2)
  currency           String             @default("AZN")
  formats            LessonFormat[]
  verificationStatus VerificationStatus @default(UNVERIFIED)
  ratingAvg          Decimal            @default(0) @db.Decimal(3, 2)
  ratingCount        Int                @default(0)
  profileViews       Int                @default(0)
  isPublished        Boolean            @default(false)
  deletedAt          DateTime?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  subjects     TutorSubject[]
  districts    TutorDistrict[]
  languages    TutorLanguage[]
  certificates Certificate[]
  favorites    Favorite[]
  applications Application[]
  reviews      Review[]
  chatThreads  ChatThread[]

  @@index([hourlyRate])
  @@index([ratingAvg])
  @@index([verificationStatus, isPublished])
  @@index([deletedAt])
}

model StudentProfile {
  id             String          @id @default(cuid())
  userId         String          @unique
  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  bio            String?
  educationLevel EducationLevel?
  deletedAt      DateTime?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  favorites    Favorite[]
  applications Application[]
  reviews      Review[]
  chatThreads  ChatThread[]

  @@index([deletedAt])
}

// ---------- Tutor owned / joins ----------

model TutorSubject {
  id            String       @id @default(cuid())
  tutorId       String
  tutor         TutorProfile @relation(fields: [tutorId], references: [id], onDelete: Cascade)
  subjectId     String
  subject       Subject      @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  priceOverride Decimal?     @db.Decimal(10, 2)
  createdAt     DateTime     @default(now())

  @@unique([tutorId, subjectId])
  @@index([subjectId])
}

model TutorDistrict {
  tutorId    String
  tutor      TutorProfile @relation(fields: [tutorId], references: [id], onDelete: Cascade)
  districtId String
  district   District     @relation(fields: [districtId], references: [id], onDelete: Cascade)

  @@id([tutorId, districtId])
  @@index([districtId])
}

model TutorLanguage {
  tutorId    String
  tutor      TutorProfile @relation(fields: [tutorId], references: [id], onDelete: Cascade)
  languageId String
  language   Language     @relation(fields: [languageId], references: [id], onDelete: Cascade)

  @@id([tutorId, languageId])
  @@index([languageId])
}

model Certificate {
  id           String            @id @default(cuid())
  tutorId      String
  tutor        TutorProfile      @relation(fields: [tutorId], references: [id], onDelete: Cascade)
  title        String
  fileUrl      String
  status       CertificateStatus @default(PENDING)
  issuedBy     String?
  reviewedById String?
  reviewedAt   DateTime?
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  @@index([tutorId])
  @@index([status])
}

model Favorite {
  id        String         @id @default(cuid())
  studentId String
  student   StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  tutorId   String
  tutor     TutorProfile   @relation(fields: [tutorId], references: [id], onDelete: Cascade)
  createdAt DateTime       @default(now())

  @@unique([studentId, tutorId])
  @@index([tutorId])
}

// ---------- Marketplace ----------

model Application {
  id          String            @id @default(cuid())
  studentId   String
  student     StudentProfile    @relation(fields: [studentId], references: [id], onDelete: Cascade)
  tutorId     String
  tutor       TutorProfile      @relation(fields: [tutorId], references: [id], onDelete: Cascade)
  subjectId   String?
  subject     Subject?          @relation(fields: [subjectId], references: [id], onDelete: SetNull)
  format      LessonFormat?
  message     String?
  status      ApplicationStatus @default(PENDING)
  respondedAt DateTime?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  reviews Review[]

  @@index([tutorId, status])
  @@index([studentId])
  @@index([subjectId])
}

model Review {
  id            String         @id @default(cuid())
  studentId     String
  student       StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  tutorId       String
  tutor         TutorProfile   @relation(fields: [tutorId], references: [id], onDelete: Cascade)
  applicationId String?
  application   Application?   @relation(fields: [applicationId], references: [id], onDelete: SetNull)
  rating        Int
  comment       String?
  status        ReviewStatus   @default(PUBLISHED)
  hiddenReason  String?
  moderatedById String?
  moderatedAt   DateTime?
  deletedAt     DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@unique([studentId, applicationId])
  @@index([tutorId, status])
}

// ---------- Chat (lean foundation; realtime transport is #34) ----------

model ChatThread {
  id            String         @id @default(cuid())
  studentId     String
  student       StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  tutorId       String
  tutor         TutorProfile   @relation(fields: [tutorId], references: [id], onDelete: Cascade)
  lastMessageAt DateTime?
  messages      ChatMessage[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@unique([studentId, tutorId])
  @@index([tutorId])
}

model ChatMessage {
  id        String     @id @default(cuid())
  threadId  String
  thread    ChatThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  senderId  String
  sender    User       @relation(fields: [senderId], references: [id], onDelete: Cascade)
  body      String
  readAt    DateTime?
  createdAt DateTime   @default(now())

  @@index([threadId, createdAt])
  @@index([senderId])
}

// ---------- Payments (lean foundation; flows are #36) ----------

model Plan {
  id            String         @id @default(cuid())
  name          String
  tier          PlanTier       @unique
  priceMonthly  Decimal        @db.Decimal(10, 2)
  currency      String         @default("AZN")
  entitlements  Json?
  isActive      Boolean        @default(true)
  subscriptions Subscription[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model Subscription {
  id                 String             @id @default(cuid())
  userId             String
  user               User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  planId             String
  plan               Plan               @relation(fields: [planId], references: [id], onDelete: Restrict)
  status             SubscriptionStatus @default(ACTIVE)
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  payments           Payment[]
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  @@index([userId])
  @@index([planId])
}

model Payment {
  id             String        @id @default(cuid())
  userId         String
  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscriptionId String?
  subscription   Subscription? @relation(fields: [subscriptionId], references: [id], onDelete: SetNull)
  amount         Decimal       @db.Decimal(10, 2)
  currency       String        @default("AZN")
  status         PaymentStatus @default(PENDING)
  provider       String?
  providerRef    String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([userId, status])
  @@index([subscriptionId])
}
```

- [ ] **Step 2: Validate + format the schema**

Run:

```bash
pnpm --filter @tutora/api exec prisma validate
pnpm --filter @tutora/api exec prisma format
```

Expected: `The schema at prisma\schema.prisma is valid 🚀`; `prisma format` normalizes spacing (re-run `prisma validate` if it reformats).

- [ ] **Step 3: Commit the schema (migration comes next)**

```bash
git add apps/tutora-api/prisma/schema.prisma
git commit -m "feat(api): full marketplace Prisma schema (#27)"
```

---

## Task 7: Generate and apply the migration

Requires the Postgres container running. `DATABASE_URL` is read from `apps/tutora-api/.env` (already present).

**Files:**

- Create: `apps/tutora-api/prisma/migrations/<timestamp>_add_marketplace_domain/migration.sql` (generated)

- [ ] **Step 1: Start Postgres**

Run:

```bash
docker compose up -d postgres
docker compose ps
```

Expected: `tutora-postgres` is `running`/`healthy`. (Start Docker Desktop first if the daemon isn't up.)

- [ ] **Step 2: Create the migration**

Run:

```bash
pnpm --filter @tutora/api exec prisma migrate dev --name add_marketplace_domain
```

Expected: a new folder `prisma/migrations/<ts>_add_marketplace_domain/` with `migration.sql` creating all new enums/tables; Prisma applies it and regenerates the client; output ends `✔ Generated Prisma Client`.

- [ ] **Step 3: Sanity-check the generated client exposes the new models**

Run:

```bash
pnpm --filter @tutora/api exec node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();console.log(['tutorProfile','studentProfile','subject','district','application','review','chatThread','plan'].every(k=>k in p));p.\$disconnect()"
```

Expected: prints `true`.

- [ ] **Step 4: Commit the migration**

```bash
git add apps/tutora-api/prisma/migrations
git commit -m "feat(api): add_marketplace_domain migration (#27)"
```

---

## Task 8: Idempotent seed script

**Files:**

- Create: `apps/tutora-api/prisma/seed.ts`
- Modify: `apps/tutora-api/package.json` (add `prisma.seed` config + `db:seed` script)

- [ ] **Step 1: Write the seed**

Create `apps/tutora-api/prisma/seed.ts`:

```ts
import { PlanTier, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DISTRICTS = ['Nasimi', 'Yasamal', 'Sabail', 'Narimanov', 'Binagadi'];
const LANGUAGES: Array<[name: string, code: string]> = [
  ['Azerbaijani', 'az'],
  ['English', 'en'],
  ['Russian', 'ru'],
  ['Turkish', 'tr'],
];
const CATEGORIES: Array<{ name: string; slug: string; subjects: Array<[string, string]> }> = [
  {
    name: 'Sciences',
    slug: 'sciences',
    subjects: [
      ['Mathematics', 'mathematics'],
      ['Physics', 'physics'],
      ['Chemistry', 'chemistry'],
    ],
  },
  {
    name: 'Languages',
    slug: 'languages',
    subjects: [
      ['English', 'english'],
      ['Russian Language', 'russian-language'],
    ],
  },
];
const PLANS: Array<{ tier: PlanTier; name: string; priceMonthly: number }> = [
  { tier: PlanTier.FREE, name: 'Free', priceMonthly: 0 },
  { tier: PlanTier.PRO, name: 'Pro', priceMonthly: 19.99 },
];

async function main(): Promise<void> {
  for (const name of DISTRICTS) {
    const slug = name.toLowerCase();
    await prisma.district.upsert({ where: { slug }, update: {}, create: { name, slug } });
  }

  for (const [name, code] of LANGUAGES) {
    await prisma.language.upsert({ where: { code }, update: {}, create: { name, code } });
  }

  for (const category of CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: { name: category.name, slug: category.slug },
    });
    for (const [subjectName, subjectSlug] of category.subjects) {
      await prisma.subject.upsert({
        where: { slug: subjectSlug },
        update: { categoryId: created.id },
        create: { name: subjectName, slug: subjectSlug, categoryId: created.id },
      });
    }
  }

  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { tier: plan.tier },
      update: { name: plan.name, priceMonthly: plan.priceMonthly },
      create: { tier: plan.tier, name: plan.name, priceMonthly: plan.priceMonthly },
    });
  }

  console.log('Seed complete: districts, languages, categories, subjects, plans.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
```

- [ ] **Step 2: Register the seed command + script in `package.json`**

In `apps/tutora-api/package.json`, add a `db:seed` script inside `"scripts"`:

```json
    "db:seed": "prisma db seed",
```

And add a top-level `"prisma"` block (sibling of `"scripts"`/`"jest"`):

```json
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  },
```

- [ ] **Step 3: Run the seed twice to prove idempotency**

Run:

```bash
pnpm --filter @tutora/api exec prisma db seed
pnpm --filter @tutora/api exec prisma db seed
```

Expected: both runs print `Seed complete: ...` and exit 0 (the second run updates in place, inserts nothing new — no unique-constraint errors).

> If ts-node fails with an ESM/module error, change the seed command to:
> `"seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"`.

- [ ] **Step 4: Verify row counts**

Run:

```bash
pnpm --filter @tutora/api exec node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{console.log({districts:await p.district.count(),languages:await p.language.count(),subjects:await p.subject.count(),plans:await p.plan.count()});await p.\$disconnect();})()"
```

Expected: `{ districts: 5, languages: 4, subjects: 5, plans: 2 }`.

- [ ] **Step 5: Commit**

```bash
git add apps/tutora-api/prisma/seed.ts apps/tutora-api/package.json
git commit -m "feat(api): idempotent taxonomy + plans seed (#27)"
```

---

## Task 9: Full verification & Definition of Done

**Files:** none (verification only)

- [ ] **Step 1: Lint, typecheck, test, build**

Run:

```bash
pnpm --filter @tutora/api lint
pnpm --filter @tutora/api typecheck
pnpm --filter @tutora/api test
pnpm --filter @tutora/api build
```

Expected: all four succeed with no errors. `lint` auto-fixes and leaves a clean tree; `test` shows all suites passing; `build` emits `dist/` (nest build + tsc-alias).

- [ ] **Step 2: Manual smoke — Swagger UI**

Run (in a background terminal): `pnpm --filter @tutora/api dev`
Then open `http://localhost:3000/docs` and confirm the UI lists the `auth`, `users`, and `health` tags with an "Authorize" (bearer) button. Confirm `GET http://localhost:3000/api/v1/health` returns `{ "status": "ok", ... }`. Stop the server.

- [ ] **Step 3: Confirm the tree is clean and DoD is met**

Run: `git status`
Expected: clean working tree; all Wave 0 commits present.

DoD checklist (from the spec §8): Swagger `/docs` ✓ · controllers tagged ✓ · `AllExceptionsFilter` envelope + unit test ✓ · `GET /api/v1/health` ✓ · full schema + migration committed, `prisma validate`/`generate` succeed ✓ · idempotent seed ✓ · lint/typecheck/test/build green ✓ · no secrets, internals not leaked ✓.

- [ ] **Step 4: Open the PR**

```bash
git push -u origin feature/backend-api-foundation
gh pr create --title "feat(api): backend Wave 0 foundation — Swagger, error filter, health, full Prisma schema (#26, #27)" --body "$(cat <<'EOF'
## Summary
Completes the tutora-api scaffold and the foundational data model (Epic #25, Wave 0).

- **#26** — Swagger UI at `/docs` (bearer auth), global `AllExceptionsFilter` emitting the standard error envelope, `GET /api/v1/health`; removed the placeholder `AppController`.
- **#27** — full marketplace Prisma schema (taxonomy, tutor/student profiles, applications, reviews, favorites, certificates) with lean chat & payments foundations; one `add_marketplace_domain` migration; idempotent taxonomy/plans seed.

## Testing
- `pnpm --filter @tutora/api lint && typecheck && test && build` — green.
- Swagger UI + health endpoint smoke-checked locally.

Closes #26
Closes #27

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR created against `main`.

---

## Notes for the implementer

- **Never** register the two exception filters in an order that lets the catch-all shadow the i18n validation filter — Task 5 Step 2 is the guard; keep it green.
- The seed and migration steps need Docker Postgres up; the Jest suite does **not** (Prisma is mocked).
- Keep money as `Decimal` end-to-end; never coerce to JS `number` in business logic (use `Prisma.Decimal`).
- Chat/payments models are intentionally lean — do not build their APIs here; that's #34/#36.
