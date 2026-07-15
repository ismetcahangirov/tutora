# Testing

Test layers across the monorepo, and how to run them. See the standards in
[`CLAUDE.md`](../CLAUDE.md).

## Layers

| Layer           | Tooling                                                     | Location                       |
| --------------- | ----------------------------------------------------------- | ------------------------------ |
| Unit            | Jest (api), Jest + RNTL (mobile), Vitest (admin/web/config) | `*.spec.ts` / `*.test.ts(x)`   |
| API integration | Nest + Supertest, one module (Prisma mocked)                | `*.integration.spec.ts` (api)  |
| API E2E         | Nest + Supertest, composed app (infra mocked)               | `apps/tutora-api/test/`        |
| Web/Admin E2E   | Playwright                                                  | `apps/tutora-{web,admin}/e2e/` |

Every workspace package — including the shared [`@tutora/config`](../packages/config)
tooling package — exposes a `test` script, so `pnpm test` fans out over all of
them. Unit and API integration tests run in the `test` gate on every push. The
Playwright and API E2E suites run in a dedicated [`e2e` workflow](../.github/workflows/e2e.yml)
so browser downloads and the heavier server boots don't slow the fast gates.

## API E2E (issue #96)

The API E2E suite boots the critical-path modules (auth, users, search,
applications, billing, health) as **one** Nest app configured exactly like
`main.ts` — the `api` prefix, URI versioning, the whitelisting `ValidationPipe`
and the global filters. Only the infrastructure boundaries (`PrismaService` and
the Google verifier) are substituted, so it runs with **no Postgres or Redis**:

```bash
pnpm --filter @tutora/api run test:e2e
```

Unlike the per-module `*.integration.spec.ts` files — each of which boots a
single module in isolation — these specs cross module boundaries with one real,
app-signed token. The `student-journey` spec walks search → apply → tutor
accept → subscribe with a single principal; the `auth` spec drives the full
sign-in → onboarding → refresh-rotation → reuse-detection → logout lifecycle
against a stateful store. The shared harness lives in
[`apps/tutora-api/test/utils`](../apps/tutora-api/test/utils).

## Running Web / Admin E2E (issue #98)

The browsers are a one-time, machine-local install (not committed):

```bash
# From apps/tutora-web or apps/tutora-admin
pnpm exec playwright install chromium
pnpm test:e2e
```

Playwright starts the app itself (`webServer`), so no server needs to be running
first:

- **Web** runs against `next dev`. The behaviour under test — locale routing,
  SEO metadata, structured data, `robots.txt`/`sitemap.xml` — is identical in dev
  and prod, and the production build is already gated by the CI `build` job.
- **Admin** runs against the production bundle via `vite build && vite preview`.
  It covers only backend-free journeys: the auth guard, the public sign-in
  screen, i18n, and theming.

Reports land in `apps/tutora-{web,admin}/e2e/.report` (git-ignored); CI uploads
them as artifacts on every run.

## Scope

The admin API and authenticated flows are intentionally out of scope for the
browser E2E suites — those paths are exercised by the API integration and API
E2E tests. Mobile E2E (Maestro, #97) is the remaining outstanding item under the
QA epic (#94); it needs a device/emulator toolchain that can't share the Node
CI, so it is tracked as its own follow-up.
