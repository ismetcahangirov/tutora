# Testing

Test layers across the monorepo, and how to run them. See the standards in
[`CLAUDE.md`](../CLAUDE.md).

## Layers

| Layer           | Tooling                                                    | Location                       |
| --------------- | ---------------------------------------------------------- | ------------------------------ |
| Unit            | Jest (api), Jest + RNTL (mobile), Vitest + RTL (admin/web) | `*.spec.ts` / `*.test.ts(x)`   |
| API integration | Nest + Supertest (Prisma mocked)                           | `*.integration.spec.ts` (api)  |
| Web/Admin E2E   | Playwright                                                 | `apps/tutora-{web,admin}/e2e/` |

Unit and API integration tests run in the `test` gate (`pnpm test`) on every
push. The Playwright E2E suites run in a dedicated [`e2e` workflow](../.github/workflows/e2e.yml)
so browser downloads and server boots don't slow the fast gates.

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

The admin API and authenticated flows are intentionally out of scope for the E2E
suites — those paths are exercised by the API integration tests. Mobile E2E
(Maestro) and API E2E against a live database are tracked separately under the
QA epic (#94).
