# Backend Wave 0 — Foundation (Scaffold + Prisma Data Model)

- **Date:** 2026-07-12
- **Epic:** #25 — Backend API (tutora-api)
- **Issues:** #26 (Scaffold NestJS app with modules & Swagger), #27 (Design Prisma schema & initial migrations)
- **Branch:** `feature/backend-api-foundation`
- **Status:** Approved (design), pending implementation plan

---

## 1. Context

The `tutora-api` NestJS app already exists — scaffolded by the Auth epic (#17) and the
i18n epic (#84), both merged to `main`. Already in place:

- NestJS 11 app, `api` global prefix, URI versioning (`/api/v1/...`).
- Global i18n `ValidationPipe` + `I18nValidationExceptionFilter` (`nestjs-i18n`).
- `ConfigModule` with `validateEnv`, typed `appConfig`.
- `PrismaModule`/`PrismaService`, Prisma 6, one migration `20260711162253_init_auth`
  containing `User`, `RefreshToken`, enums `UserRole`, `AuthProvider`.
- Modules: `auth` (full), `mail`, `users` (partial).
- Test convention: Jest with **`PrismaService` mocked** — no live DB in the suite.

Wave 0 closes the two remaining gaps in the foundation so downstream modules
(#28–#39) can be built as API surface on a complete relational model:

- **#26:** Swagger at `/docs`, a global catch-all exception filter, a health endpoint.
- **#27:** The full marketplace data model in a single foundation migration.

Non-goals for Wave 0 are listed in §7.

---

## 2. Decisions (locked during brainstorming)

| Decision                                                     | Choice                                                                                                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema scope                                                 | Core domain fully modeled; **chat & payments as lean-but-correct foundations** (refined by #34/#36)                                         |
| Money representation                                         | `Decimal @db.Decimal(10,2)` + `currency String @default("AZN")`                                                                             |
| Deletion / lifecycle                                         | Status enums for lifecycles **+ `deletedAt DateTime?`** soft-delete on `User` and profiles                                                  |
| Tutor pricing                                                | Base `hourlyRate` on `TutorProfile` + optional `priceOverride` per `TutorSubject`; formats are a set on the profile and do not change price |
| Migration strategy                                           | **One** foundation migration for the whole marketplace domain                                                                               |
| Health endpoint + Swagger decorators on existing controllers | **Included** in Wave 0                                                                                                                      |
| Pino structured logging                                      | **Deferred** to a small follow-up (out of Wave 0 scope)                                                                                     |

---

## 3. #26 — Complete the scaffold

### 3.1 Swagger at `/docs`

- Add dependency `@nestjs/swagger`.
- In `main.ts`, build the document with `DocumentBuilder`:
  - `.setTitle('Tutora API')`, description, `.setVersion(<package.json version>)`.
  - `.addBearerAuth()` so protected endpoints can be exercised from the UI.
- Mount at `docs` (i.e. `http://localhost:3000/docs`) via `SwaggerModule.setup`.
- Annotate existing controllers so the doc is meaningful:
  - `@ApiTags(...)` on `auth` and `users` controllers.
  - `@ApiBearerAuth()` on protected routes.

### 3.2 Global exception filter — standard error envelope

- New `AllExceptionsFilter` in `src/common/filters/` (`@Catch()` — catch-all).
- Maps **every** thrown error to the CLAUDE.md envelope:

  ```json
  {
    "statusCode": 400,
    "error": "BadRequest",
    "message": "…",
    "path": "/api/v1/…",
    "timestamp": "…"
  }
  ```

- `HttpException` → use its status/response; unknown errors → `500 InternalServerError`
  with a safe generic message (never leak internals; log the real error with context).
- Registered globally **alongside** the existing `I18nValidationExceptionFilter`.
  The i18n filter is registered so it keeps precedence for validation errors
  (verified by the existing i18n integration test + a new filter unit test).
  Registration order will be validated during implementation to ensure the
  specific filter wins over the catch-all.

### 3.3 Health endpoint

- `GET /api/v1/health` → `{ status: 'ok', uptime, timestamp }`.
- `@Public()` (no auth), Swagger-tagged `health`.
- Replaces the placeholder `AppController.getHello`.

---

## 4. #27 — Prisma data model (single migration)

### 4.1 Conventions

- IDs: `String @id @default(cuid())` (matches existing models).
- Timestamps: `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`.
- Money: `Decimal @db.Decimal(10,2)` + `currency String @default("AZN")`.
- Soft-delete: `deletedAt DateTime?` on `User`, `TutorProfile`, `StudentProfile`, `Review`.
  Queries filter `deletedAt: null`.
- Denormalized aggregates where they serve search/sort (documented at the field).

### 4.2 Enums (new)

| Enum                 | Values                                                                 |
| -------------------- | ---------------------------------------------------------------------- |
| `LessonFormat`       | `ONLINE`, `AT_STUDENT_HOME`, `AT_TUTOR_PLACE`                          |
| `EducationLevel`     | `SCHOOL`, `UNIVERSITY`, `EXAM_PREP`, `OTHER`                           |
| `VerificationStatus` | `UNVERIFIED`, `PENDING`, `VERIFIED`, `REJECTED`                        |
| `CertificateStatus`  | `PENDING`, `VERIFIED`, `REJECTED`                                      |
| `ApplicationStatus`  | `PENDING`, `ACCEPTED`, `DECLINED`, `CANCELLED`, `COMPLETED`, `EXPIRED` |
| `ReviewStatus`       | `PUBLISHED`, `HIDDEN`, `REMOVED`                                       |
| `PlanTier`           | `FREE`, `PRO`                                                          |
| `SubscriptionStatus` | `ACTIVE`, `PAST_DUE`, `CANCELED`, `EXPIRED`                            |
| `PaymentStatus`      | `PENDING`, `SUCCEEDED`, `FAILED`, `REFUNDED`                           |

### 4.3 Entities

**Taxonomy**

- `Category` — `id`, `name`, `slug @unique`, `subjects Subject[]`, timestamps.
- `Subject` — `id`, `name`, `slug @unique`, `categoryId?` → `Category`, relations to
  `TutorSubject[]`, `Application[]`, timestamps.
- `District` — `id`, `name`, `slug @unique`, `tutorDistricts TutorDistrict[]`, timestamps.
- `Language` — `id`, `name`, `code @unique` (e.g. `az`,`en`,`ru`,`tr`),
  `tutorLanguages TutorLanguage[]`, timestamps.

> Localized taxonomy names (az/en/ru) are **deferred** to the CMS/localization work
> (#85); Wave 0 stores a single canonical `name` + `slug`/`code`.

**Profiles**

- `TutorProfile` — 1:1 with `User` (`userId @unique`):
  `bio String?`, `experienceYears Int @default(0)`,
  `hourlyRate Decimal @db.Decimal(10,2)`, `currency String @default("AZN")`,
  `formats LessonFormat[]`, `verificationStatus VerificationStatus @default(UNVERIFIED)`,
  `ratingAvg Decimal @db.Decimal(3,2) @default(0)`, `ratingCount Int @default(0)`,
  `profileViews Int @default(0)`, `isPublished Boolean @default(false)`,
  `deletedAt DateTime?`, timestamps.
  Relations: `subjects TutorSubject[]`, `districts TutorDistrict[]`,
  `languages TutorLanguage[]`, `certificates Certificate[]`,
  `applications Application[]`, `reviews Review[]`, `chatThreads ChatThread[]`.
- `StudentProfile` — 1:1 with `User` (`userId @unique`):
  `bio String?`, `educationLevel EducationLevel?`, `deletedAt DateTime?`, timestamps.
  Relations: `favorites Favorite[]`, `applications Application[]`,
  `reviews Review[]`, `chatThreads ChatThread[]`.

**Joins / owned**

- `TutorSubject` — `tutorId`, `subjectId`, `priceOverride Decimal? @db.Decimal(10,2)`,
  `@@unique([tutorId, subjectId])`.
- `TutorDistrict` — `tutorId`, `districtId`, `@@id([tutorId, districtId])`.
- `TutorLanguage` — `tutorId`, `languageId`, `@@id([tutorId, languageId])`.
- `Certificate` — `id`, `tutorId`, `title`, `fileUrl` (Cloud Storage),
  `status CertificateStatus @default(PENDING)`, `issuedBy String?`,
  `reviewedById String?`, `reviewedAt DateTime?`, timestamps.
- `Favorite` — `id`, `studentId`, `tutorId`, `createdAt`, `@@unique([studentId, tutorId])`.

**Marketplace**

- `Application` — student→tutor request: `id`, `studentId`, `tutorId`, `subjectId?`,
  `format LessonFormat?`, `message String?`,
  `status ApplicationStatus @default(PENDING)`, `respondedAt DateTime?`, timestamps.
  `@@index([tutorId, status])`, `@@index([studentId])`.
- `Review` — post-session: `id`, `studentId` (author), `tutorId`, `applicationId?`,
  `rating Int` (1–5), `comment String?`, `status ReviewStatus @default(PUBLISHED)`,
  `hiddenReason String?`, `moderatedById String?`, `moderatedAt DateTime?`,
  `deletedAt DateTime?`, timestamps. `@@index([tutorId, status])`.
  `@@unique([studentId, applicationId])` to prevent duplicate reviews per session.

**Chat (lean foundation — transport is #34)**

- `ChatThread` — `id`, `studentId`, `tutorId`, `lastMessageAt DateTime?`,
  `messages ChatMessage[]`, timestamps, `@@unique([studentId, tutorId])`.
- `ChatMessage` — `id`, `threadId`, `senderId` (→ `User`), `body String`,
  `readAt DateTime?`, `createdAt`. `@@index([threadId, createdAt])`.

**Payments (lean foundation — flows are #36)**

- `Plan` — `id`, `name`, `tier PlanTier`, `priceMonthly Decimal @db.Decimal(10,2)`,
  `currency String @default("AZN")`, `entitlements Json?`,
  `isActive Boolean @default(true)`, timestamps.
- `Subscription` — `id`, `userId`, `planId`, `status SubscriptionStatus`,
  `currentPeriodStart DateTime?`, `currentPeriodEnd DateTime?`, `payments Payment[]`,
  timestamps, `@@index([userId])`.
- `Payment` — `id`, `userId`, `subscriptionId?`,
  `amount Decimal @db.Decimal(10,2)`, `currency String @default("AZN")`,
  `status PaymentStatus @default(PENDING)`, `provider String?`, `providerRef String?`,
  timestamps, `@@index([userId, status])`.

**`User` additions**

- `tutorProfile TutorProfile?`, `studentProfile StudentProfile?`, `deletedAt DateTime?`,
  and back-relations: `chatMessages ChatMessage[]`, `subscriptions Subscription[]`,
  `payments Payment[]`.

### 4.4 Indexes (search-oriented, for #31)

Btree indexes on `TutorProfile(hourlyRate)`, `(ratingAvg)`,
`(verificationStatus, isPublished)`, `(deletedAt)`; all join-table FKs;
`Application(tutorId, status)`, `Review(tutorId, status)`.
Advanced indexes (e.g. GIN on `formats`) are left to the Search module (#31).

### 4.5 Denormalization

`ratingAvg` / `ratingCount` on `TutorProfile` are denormalized so search can
filter/sort by rating without aggregating `Review` rows. The Reviews module (#33)
owns keeping them in sync on review create/moderate/delete.

### 4.6 Seed

- `prisma/seed.ts`, idempotent via `upsert`, wired through `prisma.seed`:
  - A handful of Baku `District`s.
  - A few `Category` + `Subject` rows.
  - `Language`s: az, en, ru, tr.
  - `Plan`s: FREE and PRO.
- Not executed by the Jest suite; used for local/dev and downstream (#31).

---

## 5. Data flow

Wave 0 adds no request handlers beyond the health endpoint. It establishes:

- the OpenAPI surface (`/docs`) that every subsequent module documents into, and
- the relational model that modules #28–#39 read/write through `PrismaService`.

Downstream request flow (unchanged): `Controller → Service → PrismaService → Postgres`,
with validation at the boundary (DTOs) and errors shaped by the global filters.

---

## 6. Testing

Consistent with the existing **mock-Prisma** convention (no live DB in Jest):

- **Unit:** `AllExceptionsFilter` maps `HttpException` and a generic `Error` to the
  standard envelope (status, error, message, path, timestamp); health controller
  returns `status: 'ok'`.
- **Swagger:** build the OpenAPI document in-memory (`SwaggerModule.createDocument`
  against the app) and assert it contains bearer security and the expected tags —
  no HTTP server needed.
- **Schema:** `prisma validate` passes; `prisma generate` produces a client exposing
  the new delegates; `typecheck` + `build` prove they compile. The generated
  migration is committed. `pnpm --filter @tutora/api test` stays green.

Every check is deterministic and offline.

---

## 7. Out of scope (YAGNI — owned elsewhere)

- Availability / scheduling model (tutor calendar) — later task.
- Notifications tables — #35.
- Media/upload records beyond `Certificate.fileUrl` — #37.
- Admin audit logs, CMS, feature flags, system settings — their own epics.
- GIN / full-text search indexes — #31.
- Pino structured logging — deferred follow-up.
- Rate limiting & Redis caching — #39.

---

## 8. Definition of Done (Wave 0)

- [ ] `@nestjs/swagger` added; `/docs` serves the OpenAPI UI with bearer auth.
- [ ] Existing `auth`/`users` controllers Swagger-annotated.
- [ ] `AllExceptionsFilter` returns the standard envelope; unit-tested; does not
      regress i18n validation errors.
- [ ] `GET /api/v1/health` returns `ok`.
- [ ] `schema.prisma` extended with all §4 models/enums; one migration generated and
      committed; `prisma validate` + `prisma generate` succeed.
- [ ] `prisma/seed.ts` seeds taxonomy + plans idempotently.
- [ ] `lint`, `typecheck`, `test`, `build` green for `@tutora/api`.
- [ ] No hardcoded secrets; unknown errors never leak internals in responses.
- [ ] Conventional Commits; PR follows template and links #26/#27.
