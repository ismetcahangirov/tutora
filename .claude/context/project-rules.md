# Tutora — Project Rules & Definition of Done

## Security Rules

### Secrets Management
- **Never commit secrets to version control.** No API keys, JWT secrets, database URLs, Firebase credentials, or service account files in source code.
- All secrets must live in environment variables (`.env` files for local, secret managers for production).
- `.env` files must be in `.gitignore`. Provide `.env.example` with placeholder values only.
- Rotate any secret that is accidentally committed immediately.

### Authentication & Authorization
- JWT access tokens expire in **15 minutes**. Refresh tokens expire in **7 days**.
- Refresh tokens are stored hashed in the database. Plain tokens are never persisted server-side.
- Access tokens are stored in MMKV (in-memory; not written to encrypted disk). Refresh tokens are stored in `expo-secure-store` (device keychain).
- All protected routes require a valid JWT (`JwtAuthGuard`).
- Role-based access control is enforced at the controller level via `RolesGuard` and `@Roles()` decorator.
- Never trust the client's role claim from the request body — read it from the verified JWT payload.
- Token blacklisting via Redis for logout and token rotation.

### Input Validation
- All incoming data on the backend is validated via `class-validator` DTOs (Prisma layer) and `Zod` schemas (application layer).
- Never trust client-provided IDs to scope data. Always scope queries by the authenticated user's ID.
- Sanitize all string inputs that will be displayed to other users (prevent XSS in chat messages, review text, etc.).
- File uploads: validate MIME type and file size server-side (not just on client). Reject executables.

### Rate Limiting
- Authentication endpoints (`/auth/login`, `/auth/register`, `/auth/refresh`): max **5 requests per minute per IP**.
- Search endpoint: max **30 requests per minute per user**.
- General API endpoints: max **100 requests per minute per user**.
- Implement with NestJS `ThrottlerModule` + Redis store.

### RBAC
- Three roles: `STUDENT`, `TUTOR`, `ADMIN`.
- Role permissions:
  - `STUDENT`: view tutors, submit applications, leave reviews, use chat.
  - `TUTOR`: manage own profile, accept/reject applications, use chat.
  - `ADMIN`: full access to all data, content moderation, user management.
- Principle of least privilege: grant only the minimum permissions required.

### API Security
- CORS: whitelist only known client origins.
- Helmet: enforce security headers.
- No stack traces in production error responses.
- All database queries go through Prisma (parameterized). No raw SQL string concatenation.

---

## Performance Budgets

### Mobile App

| Metric | Budget |
|---|---|
| Cold start (JS bundle load) | < 2 seconds |
| Time to interactive (first screen) | < 3 seconds |
| Search results render (after API response) | < 100 ms |
| List scroll (60 fps target) | No frames dropped during fast scroll |
| App bundle size (JS) | < 5 MB uncompressed |
| Image load (CDN) | Blurhash shown immediately; full image < 1 second on LTE |

### API

| Metric | Budget |
|---|---|
| Search endpoint (cached) | p95 < 50 ms |
| Search endpoint (cache miss) | p95 < 300 ms |
| Auth endpoints | p95 < 200 ms |
| Chat message send | p95 < 100 ms |
| File upload initiation | p95 < 500 ms |

### Landing Page (Next.js)

| Metric | Target |
|---|---|
| Lighthouse Performance | ≥ 95 |
| Lighthouse Accessibility | ≥ 95 |
| First Contentful Paint | < 1.2 s |
| Largest Contentful Paint | < 2.5 s |
| Cumulative Layout Shift | < 0.1 |

---

## Accessibility Requirements

- Minimum tap target size: **44 × 44 pt** for all interactive elements.
- Color contrast: **≥ 4.5:1** for body text, **≥ 3:1** for large text (18 pt+).
- Never convey information through color alone — always pair with text or icon.
- All icon-only buttons must have `accessibilityLabel`.
- All images must have descriptive `accessibilityLabel` (or `accessibilityRole="image"` with label).
- All form inputs must have associated labels.
- Error messages must be announced via `accessibilityLiveRegion`.
- Support Dynamic Type: use `allowFontScaling={true}` (the default) on all `<Text>` components. Do not cap font sizes.
- Respect the `reduceMotion` system setting — disable or simplify all animations.
- Test with VoiceOver (iOS) and TalkBack (Android) before marking a UI feature done.

---

## Testing Expectations

### What must be tested

| Scope | Minimum |
|---|---|
| Pure utility functions | 100% unit test coverage |
| Custom hooks | Unit tests with `renderHook` |
| API service functions | Integration tests against a test DB (or mocked Axios) |
| NestJS controllers | Unit tests (mocked service) |
| NestJS services | Unit tests (mocked repository) |
| Critical user flows (auth, search, apply) | E2E test (Detox or Maestro) |
| Search filter logic | Parametric unit tests for all filter combinations |

### What does not need tests
- Pure UI presentational components with no logic.
- Boilerplate configuration files.
- Third-party SDK wrappers (they are tested by the library authors).

### Testing rules
- Tests live alongside the code: `src/features/auth/hooks/__tests__/useLogin.test.ts`.
- Test file names: `<name>.test.ts` or `<name>.spec.ts`.
- Never assert on implementation details; assert on behavior and output.
- Use `beforeEach` to reset mocks. Never share mutable state between tests.
- CI must run all tests before merge to `develop`.

---

## Localization Rules

- **No hardcoded user-visible strings anywhere in the codebase.**
- All strings go into translation files: `src/shared/lib/i18n/locales/az.json`, `en.json`, `ru.json`.
- Use `i18next` + `expo-localization` for locale detection.
- Key format: `<feature>.<component>.<key>` — e.g., `search.filters.districtLabel`, `auth.login.buttonLabel`.
- Translation keys must be present in all three locales before a feature is considered done.
- RTL is not required for current locales (az, en, ru are all LTR), but do not hardcode `left`/`right` layout assumptions — use `start`/`end` where possible.
- Date and number formatting must respect locale (use `Intl.DateTimeFormat`, `Intl.NumberFormat`, or `expo-localization` utilities).
- Currency: display in Azerbaijani Manat (₼). Use `Intl.NumberFormat` with `style: 'currency', currency: 'AZN'`.

---

## "Do Not" List

- **Do not** use `any` in TypeScript. Use `unknown` + narrowing, or define a proper type.
- **Do not** use `console.log` in production code. Use the structured logger.
- **Do not** commit `.env` files or any file containing secrets.
- **Do not** use gradients anywhere in the UI (backgrounds, buttons, cards, text).
- **Do not** hardcode user-visible strings. Use i18n keys.
- **Do not** write business logic in controllers (NestJS) or in screens (React Native). Delegate to services/hooks.
- **Do not** access the database directly from controllers. Use the service layer.
- **Do not** use `FlatList` for lists — use `FlashList`.
- **Do not** use `AsyncStorage` — use `MMKV` (non-sensitive) or `expo-secure-store` (sensitive).
- **Do not** use Redux or MobX. Use TanStack Query + Zustand.
- **Do not** push directly to `main` or `develop`.
- **Do not** merge a PR without at least one approval.
- **Do not** disable ESLint rules without a comment explaining why.
- **Do not** skip writing tests for utility functions and hooks.
- **Do not** use inline styles in React Native components (use `StyleSheet.create` or NativeWind).
- **Do not** store the refresh token in MMKV — use `expo-secure-store`.
- **Do not** return HTTP 200 for errors. Use correct status codes (400, 401, 403, 404, 409, 422, 429, 500).
- **Do not** expose internal error details (stack traces, query strings) in API responses.
- **Do not** create components longer than 300 lines without extracting sub-components.
- **Do not** write migrations that could lose data without a tested rollback path.

---

## Definition of Done

A feature, bugfix, or change is **Done** only when all of the following are true:

### Code Quality
- [ ] Code compiles with `tsc --noEmit` (zero type errors)
- [ ] ESLint passes with zero errors
- [ ] Prettier formatting applied
- [ ] No `console.log`, `console.warn`, or `console.error` left in production code
- [ ] No `any` type used without documented justification
- [ ] No commented-out code committed

### Behavior
- [ ] Feature works correctly on iOS (tested on simulator or device)
- [ ] Feature works correctly on Android (tested on emulator or device)
- [ ] All five UI states handled: loading, empty, error, success, pagination
- [ ] Dark mode tested and works correctly
- [ ] Edge cases handled (empty input, network error, very long strings, etc.)

### Localization
- [ ] All user-visible strings use i18n keys
- [ ] Keys present in `az.json`, `en.json`, `ru.json`

### Accessibility
- [ ] All interactive elements have `accessibilityLabel`
- [ ] Tap targets are ≥ 44 × 44 pt
- [ ] Feature tested with VoiceOver or TalkBack (for UI changes)

### Design
- [ ] Matches the design spec (spacing, colors, typography, radius)
- [ ] No hardcoded colors — design tokens used
- [ ] No gradients
- [ ] Consistent with existing patterns in the design system

### Security
- [ ] No secrets in source code
- [ ] Input validated (client and server)
- [ ] Authorization checked (not just authentication)
- [ ] No data exposed that the current user should not see

### Testing
- [ ] Unit tests written for new utility functions and hooks
- [ ] Existing tests still pass
- [ ] New API endpoints have at least controller-level unit tests

### Git / Process
- [ ] Branch named correctly (`feature/`, `bugfix/`, etc.)
- [ ] Commits follow Conventional Commits format
- [ ] PR description filled out
- [ ] PR has at least one approval
- [ ] Branch is up to date with `develop`
- [ ] CI pipeline is green
