# Auth Wave 1 — Prisma foundation + Google OAuth (#18) + JWT issuance (#19)

**Date:** 2026-07-11
**Epic:** #17 Authentication & Authorization
**Issues in scope:** Prisma foundation (prerequisite), #18 Google OAuth on backend, #19 JWT access + refresh token issuance
**Branch:** `feature/auth-google-oauth-jwt`
**Surface:** `apps/tutora-api` (NestJS 11)

---

## 1. Goal & scope

Establish the backend authentication foundation for Tutora so a mobile client can
sign in with Google and receive an access token plus a refresh token.

**In scope (Wave 1):**

1. **Prisma foundation** — add Prisma to `tutora-api`, a global `PrismaModule` /
   `PrismaService`, a `schema.prisma` with `User`, `RefreshToken`, and the
   `UserRole` / `AuthProvider` enums, and the first migration.
2. **#18 Google OAuth (backend)** — `POST /api/v1/auth/google` verifies a Google
   `idToken` and provisions or links a `User`.
3. **#19 JWT issuance** — a `TokenService` mints a short-lived access JWT and an
   opaque refresh token (persisted as a peppered hash), returned from the endpoint.

**Explicitly out of scope (later waves):**

- `POST /api/v1/auth/refresh` exchange, rotation, revocation, reuse detection → **#20**.
- `JwtAuthGuard` / `RolesGuard` and role enforcement → **#21**.
- Mobile native Google sign-in + Secure Store → **#22**.
- Onboarding & role selection flow → **#23**.
- Axios auto-refresh interceptors → **#24**.
- Email/password login, logout, and Redis access-token blacklist (no password auth
  in this epic; logout/blacklist belong to #20's revocation work).
- A global response envelope and global exception filter (cross-cutting, later).

## 2. Design decisions (confirmed with product owner)

| Decision                 | Choice                                      | Rationale                                                                                                                                                                                   |
| ------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Refresh token form       | **Opaque, hashed in DB**                    | Matches `architecture.md`; cleanly supports rotation + reuse detection in #20. `JWT_REFRESH_SECRET` is repurposed as the HMAC pepper for the stored hash.                                   |
| Role on first sign-in    | **Nullable `role` + `onboardingCompleted`** | Role is chosen in onboarding (#23). New users have `role = null`, `onboardingCompleted = false`.                                                                                            |
| Wave 1 refresh lifecycle | **Issue + persist only**                    | The `/auth/refresh` exchange, rotation, and reuse detection stay in #20.                                                                                                                    |
| Google verification      | **Verify client-sent `idToken`**            | Mobile-first: the native client (#22) performs Google sign-in and posts the `idToken`; the backend verifies it with `google-auth-library`. No server-side authorization-code redirect flow. |

## 3. Data model

`apps/tutora-api/prisma/schema.prisma`:

```prisma
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
  role                UserRole?      // null until onboarding (#23) sets it
  onboardingCompleted Boolean        @default(false)
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt
  refreshTokens       RefreshToken[]
}

model RefreshToken {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String    @unique // HMAC-SHA256(rawToken, JWT_REFRESH_SECRET)
  expiresAt DateTime
  revokedAt DateTime? // reserved for #20; always null in Wave 1
  createdAt DateTime  @default(now())

  @@index([userId])
  @@index([expiresAt])
}
```

**Forward-compat note:** `revokedAt` and `tokenHash @unique` are added now (cheap,
obviously needed) so #20 does not require a schema migration to add revocation.
The rotation _logic_ is not built in Wave 1. Any rotation-family columns beyond
`revokedAt` are deferred to #20 (YAGNI here).

## 4. Module structure

```
apps/tutora-api/
  prisma/
    schema.prisma
    migrations/
  src/
    prisma/
      prisma.module.ts        // @Global
      prisma.service.ts       // extends PrismaClient; connect on init, disconnect on destroy
    common/
      utils/
        parse-duration.ts     // '15m' | '7d' -> milliseconds
    modules/
      users/
        users.module.ts
        users.service.ts      // upsertFromGoogle(profile)
      auth/
        auth.module.ts
        auth.controller.ts    // POST /auth/google (version '1')
        auth.service.ts       // orchestration: verify -> upsert -> issue
        dto/
          google-auth.dto.ts  // { idToken: string }
        services/
          google-verifier.service.ts  // wraps OAuth2Client.verifyIdToken
          token.service.ts             // access JWT + opaque refresh issuance/persist
        types/
          auth.types.ts       // GoogleProfile, AuthTokens, AuthResponse
```

**Dependency direction:** `auth` depends on `users` (per `architecture.md` module
boundaries). `PrismaModule` is `@Global` so any module injects `PrismaService`.
Path aliases already configured: `@/`, `@config/`, `@common/`, `@modules/`.

## 5. Data flow — `POST /api/v1/auth/google`

Request body: `{ "idToken": "<google id token>" }`

1. **Validate DTO** — `idToken` is a non-empty string (`class-validator`, global
   `ValidationPipe` with `whitelist: true, transform: true`).
2. **Verify** — `GoogleVerifierService.verify(idToken)` calls
   `OAuth2Client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })`. On any
   failure, or when `email_verified !== true`, throw `UnauthorizedException`.
   Returns `GoogleProfile { googleId (sub), email, emailVerified, name?, picture?, locale? }`.
3. **Provision/link** — `UsersService.upsertFromGoogle(profile)`:
   - find by `googleId` → return it (refresh `name`/`avatarUrl`/`locale` if changed);
   - else find by `email` → link `googleId` to the existing user and return it;
   - else create a new user (`role = null`, `onboardingCompleted = false`,
     `emailVerified = true`, `provider = GOOGLE`).
4. **Issue tokens** — `TokenService.issueTokens(user)`:
   - `accessToken = JwtService.sign({ sub, email, role, onboardingCompleted },
{ secret: JWT_ACCESS_SECRET, expiresIn: JWT_ACCESS_EXPIRES_IN })`;
   - `rawRefresh = randomBytes(32).toString('base64url')`;
   - `tokenHash = createHmac('sha256', JWT_REFRESH_SECRET).update(rawRefresh).digest('hex')`;
   - `expiresAt = new Date(Date.now() + parseDuration(JWT_REFRESH_EXPIRES_IN))`;
   - persist `RefreshToken { userId, tokenHash, expiresAt }`;
   - return `{ accessToken, refreshToken: rawRefresh }`.
5. **Respond** — `200 OK`:
   ```json
   {
     "accessToken": "<jwt>",
     "refreshToken": "<opaque>",
     "user": {
       "id": "...",
       "email": "...",
       "name": "...",
       "avatarUrl": "...",
       "role": null,
       "onboardingCompleted": false
     }
   }
   ```

The raw refresh token is returned to the client exactly once and **never stored in
plaintext**; only its HMAC hash is persisted.

## 6. Configuration changes

**`src/config/env.ts`** — add:

```ts
GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
```

**`.env.example`** (root + `apps/tutora-api`) — add `GOOGLE_CLIENT_ID=` and a
comment noting that `JWT_REFRESH_SECRET` also serves as the refresh-token HMAC pepper.

**`main.ts`** — add:

```ts
app.setGlobalPrefix('api');
app.enableVersioning({ type: VersioningType.URI }); // default prefix "v"
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
```

Yielding the route `/api/v1/auth/google`.

## 7. New dependencies

Runtime: `@prisma/client`, `@nestjs/jwt`, `google-auth-library`, `class-validator`,
`class-transformer`.
Dev: `prisma`.

`package.json` scripts (api): `db:generate` (`prisma generate`),
`db:migrate` (`prisma migrate dev`), `db:deploy` (`prisma migrate deploy`).

## 8. Error handling

- Invalid / expired / wrong-audience `idToken`, or unverified email →
  `UnauthorizedException` (HTTP 401). The verifier never leaks Google's internal
  error detail to the client; details are logged server-side without the token value.
- DTO validation failure → `BadRequestException` (400) via `ValidationPipe`.
- No secrets, tokens, or `idToken` values are ever logged.
- A global exception filter / response envelope is out of scope; Wave 1 uses Nest's
  default error shape.

## 9. Testing (TDD — write failing tests first)

Unit (Jest, `*.spec.ts`, Prisma and `google-auth-library` mocked):

- `parse-duration.spec.ts` — `'15m'`, `'7d'`, `'30s'`, `'1h'`; rejects malformed input.
- `token.service.spec.ts` — access JWT carries `{ sub, email, role, onboardingCompleted }`;
  refresh is persisted **hashed** (raw value never written); `expiresAt` computed from
  `JWT_REFRESH_EXPIRES_IN`; returns the raw refresh once.
- `google-verifier.service.spec.ts` — valid token → `GoogleProfile`; library throw →
  `UnauthorizedException`; `email_verified = false` → `UnauthorizedException`.
- `users.service.spec.ts` — creates a new user; links `googleId` to an existing
  email; returns the existing user when found by `googleId`.
- `auth.service.spec.ts` — orchestration wiring (verify → upsert → issue) with mocks;
  maps a verifier failure to 401.

Prisma is mocked in unit tests (manual typed mock of the methods used); no real DB.

## 10. Deviations from `architecture.md` (intentional)

1. **Prisma location** — schema lives at `apps/tutora-api/prisma/`, not
   `src/prisma/`, so non-TypeScript assets (schema, migrations) stay out of the
   `nest build` output.
2. **Refresh token** — opaque + HMAC-hashed; `JWT_REFRESH_SECRET` is the pepper, not
   a JWT signing secret (the doc's flow already specifies an opaque, hashed refresh).
3. **No password auth** — Wave 1 is Google-only, matching epic #17's OAuth focus.

## 11. Definition of Done (Wave 1)

- `typecheck`, `lint`, and `format` pass with no new warnings.
- All new unit tests pass; refresh-token secrecy is covered by a regression test.
- `prisma migrate` produces a clean initial migration; `prisma generate` runs in build.
- `POST /api/v1/auth/google` verified end-to-end against a real Google `idToken`
  (manual) and via mocked unit tests.
- No hardcoded secrets; `idToken` and tokens never logged; input validated at the boundary.
- Conventional Commits; PR uses the template and links the issues.
