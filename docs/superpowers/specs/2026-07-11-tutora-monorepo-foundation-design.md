# Tutora Monorepo Foundation — Design Spec

**Epic:** [#1 — 🏗️ Project Setup & Infrastructure](https://github.com/ismetcahangirov/tutora/issues/1)
**Date:** 2026-07-11
**Status:** Approved — implementation in progress

---

## 1. Purpose

Establish the repository scaffolding, tooling, and local developer environment for
**Tutora** across its four surfaces (mobile, backend API, admin panel, landing page),
so that every subsequent feature is built on a clean, strongly-typed, lint-enforced,
reproducible foundation.

This spec covers the six sub-issues of Epic #1:

| # | Title |
|---|-------|
| #2 | Scaffold repositories (tutora, tutora-api, tutora-admin, tutora-web) |
| #3 | Configure TypeScript, ESLint & Prettier across packages |
| #4 | Set up Husky, lint-staged & commitlint (Conventional Commits) |
| #5 | Configure absolute imports & path aliases |
| #6 | Add Zod-based environment variable validation |
| #7 | Docker Compose for Postgres + Redis |

---

## 2. Key Decisions (confirmed with product owner)

1. **Repo topology → Monorepo** using **pnpm workspaces**. The issue language
   ("four *packages*", "*shared* ESLint + Prettier config across packages") takes
   precedence over `architecture.md`'s "four independent repos" framing. A single
   repo with shared config removes duplication and keeps standards consistent.
2. **Scaffolding depth → Official CLIs + dependency install.** Each app is generated
   with its canonical scaffolder (`create-expo-app`, `nest new`,
   `create vite`, `create-next-app`) so the foundation is idiomatic and the
   Definition of Done (`lint`/`typecheck`/`test` green) is genuinely satisfiable.
3. **Workflow → One branch + Draft PR per sub-issue**, stacked in dependency order,
   merged sequentially (#2 → #3 → #4 → #5 → #6 → #7).
4. **Package manager → pnpm** (activated via corepack, version pinned in root
   `packageManager`).
5. **Task orchestration → Turborepo** — confirmed by `.gitignore` already ignoring
   `.turbo/`. Provides cached `build`/`lint`/`typecheck`/`test` pipelines.

---

## 3. Target Structure

```
tutora/                          # root — private workspace
├── pnpm-workspace.yaml          # workspace globs: apps/*, packages/*
├── turbo.json                   # task pipeline (build, lint, typecheck, test, dev)
├── package.json                 # root scripts + shared devDeps; packageManager pinned
├── tsconfig.base.json           # strict TS base every package extends
├── .prettierrc.json             # (or preset re-exported from packages/config)
├── .nvmrc / engines             # pin Node 22
├── docker-compose.yml           # Postgres 15 + Redis 7 (#7)
├── docker/                      # init SQL / seed scripts for the DB (#7)
├── .husky/                      # git hooks (#4)
├── .env.example                 # documented, committed (real .env is gitignored)
├── packages/
│   └── config/                  # @tutora/config — shared eslint + tsconfig + prettier
└── apps/
    ├── tutora/                  # Expo React Native  (create-expo-app)
    ├── tutora-api/              # NestJS             (nest new)
    ├── tutora-admin/            # React + Vite       (create vite, react-ts)
    └── tutora-web/              # Next.js            (create-next-app)
```

**Naming note:** the workspace root and the mobile app are both called `tutora`;
the mobile app lives at `apps/tutora` and is the npm package `@tutora/mobile`
(bundle id `com.tutora.mobile`). API/admin/web are `@tutora/api`, `@tutora/admin`,
`@tutora/web`.

---

## 4. Sub-Issue Breakdown

### #2 — Scaffold (`chore/scaffold-monorepo`)
- Root workspace: `pnpm-workspace.yaml`, `turbo.json`, root `package.json`
  (scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `format`), `packageManager`
  pinned to pnpm.
- Scaffold the four apps with official CLIs; strip nested lockfiles and align each
  app's `package.json` to the workspace.
- Create the feature-first folder skeleton per `architecture.md`:
  - mobile/admin/web: `src/features/`, `src/shared/{components,hooks,lib,types,utils,constants}`
  - api: `src/modules/`, `src/common/`, `src/config/`, `prisma/`
- Each app exposes standard scripts (`dev`, `build`, `lint`, `typecheck`, `test`).
- **DoD:** `pnpm install` clean; `pnpm -w build`/`lint`/`typecheck` run (may be
  trivially green on empty apps).

### #3 — TypeScript / ESLint / Prettier (`chore/lint-format-tooling`)
- `packages/config` publishes: a strict `tsconfig` base, a shared flat ESLint config
  (`@typescript-eslint/recommended` + react + react-hooks + import, `no-explicit-any: error`,
  `no-console: warn`, import-order), and a Prettier preset
  (`singleQuote`, `trailingComma: all`, `printWidth: 100`, `tabWidth: 2`, `semi`, `arrowParens: always`).
- Every app extends these — no per-app rule drift.
- **DoD:** `pnpm -w lint` and `pnpm -w typecheck` green across all apps.

### #4 — Husky / lint-staged / commitlint (`chore/git-hooks`)
- Root Husky install; `pre-commit` → lint-staged
  (`*.{ts,tsx}`: eslint --fix + prettier --write; `*.{json,md}`: prettier --write).
- `commit-msg` → commitlint with `@commitlint/config-conventional`.
- `pre-push` → `pnpm -w typecheck` (+ tests once they exist).
- **DoD:** a non-conventional commit is rejected; staged files are auto-fixed.

### #5 — Absolute imports & path aliases (`chore/path-aliases`)
- Aliases per app in `tsconfig` + bundler config:
  - mobile: `@features/*`, `@shared/*`, `@app/*` (tsconfig + `babel.config.js`/metro).
  - admin (Vite): `@/*` → `src/*` (tsconfig + `vite.config` resolve.alias).
  - web (Next): `@/*` → `src/*` (tsconfig paths).
  - api (Nest): `@modules/*`, `@common/*`, `@config/*` (tsconfig paths + jest moduleNameMapper).
- Seed barrel `index.ts` files at each public module boundary.
- ESLint `import/no-relative-parent-imports` (or equivalent) to forbid `../../..`.
- **DoD:** an aliased import resolves in build, typecheck, and tests.

### #6 — Zod env validation (`chore/env-validation`)
- `tutora-api`: `src/config/env.ts` — a Zod schema parsed at startup; process exits
  with a clear message on invalid/missing vars. Typed `Env` exported and consumed
  via Nest `ConfigModule` (validate hook).
- Front-end apps: validate their public env (`EXPO_PUBLIC_*`, `VITE_*`, `NEXT_PUBLIC_*`)
  with a small shared Zod helper.
- `.env.example` documents every variable.
- **DoD:** booting with a missing required var fails fast with a readable error;
  a valid env boots.

### #7 — Docker Compose (`chore/docker-compose`)
- `docker-compose.yml`: **PostgreSQL 15** + **Redis 7**, named volumes, healthchecks,
  ports from env (`.env.example` documents them).
- `docker/postgres/init/` seed SQL (extensions, e.g. `uuid-ossp`/`pg_trgm`; a dev
  database + a minimal seed row set for smoke tests).
- Root scripts: `db:up`, `db:down`, `db:logs`.
- **DoD:** `docker compose up -d` yields healthy Postgres + Redis reachable locally.

---

## 5. Dependencies & Ordering

```
#2 scaffold  ──┬─▶ #3 lint/format ──▶ #4 hooks ──▶ #5 aliases ──▶ #6 env
               └─▶ #7 docker (independent; can land any time after #2)
```

Branches are stacked (each cut from the previous) and merged in the order above.
#7 depends only on #2.

---

## 6. Risks & Mitigations

- **Heavy installs on Windows.** Official scaffolds + `node_modules` are large and
  slow; native/Expo deps can fail. *Mitigation:* install incrementally per app;
  if the Bash sandbox blocks network, hand the install command to the user to run
  via the `!` prefix.
- **Nested lockfiles from scaffolders.** Each CLI emits its own lockfile/package
  manager assumptions. *Mitigation:* remove nested lockfiles, re-install from root
  with pnpm, pin `packageManager`.
- **Protected `main`.** No direct pushes. *Mitigation:* Draft PRs per sub-issue,
  sequential merge; reviewer approves.
- **`no-explicit-any: error` vs generated code.** Some scaffolds emit `any`.
  *Mitigation:* fix or narrow generated `any`s during #3; never blanket-disable.

---

## 7. Definition of Done (per sub-issue, per root `CLAUDE.md`)

`typecheck` + `lint` + `format` pass, tests (where applicable) pass, no hardcoded
secrets, `.env.example` updated, Conventional Commits + PR template followed,
reviewed and CI green.
