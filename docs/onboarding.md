# Developer Onboarding

The fast path from a fresh clone to a running Tutora stack. If you only need to
touch one surface, you can stop after that surface boots — nothing here requires
the whole stack to be up.

> **Tutora is a monorepo** managed with [pnpm workspaces](https://pnpm.io/workspaces)
> and [Turborepo](https://turborepo.com). One `pnpm install` at the root wires up
> all four apps (`apps/*`) and the shared config package (`packages/*`). This is
> the authoritative setup guide — the per-surface snippets in the README are a
> summary.

## Contents

- [1. Prerequisites](#1-prerequisites)
- [2. Clone & install](#2-clone--install)
- [3. Environment variables](#3-environment-variables)
- [4. Start the datastores](#4-start-the-datastores)
- [5. Run the backend](#5-run-the-backend)
- [6. Run a client app](#6-run-a-client-app)
- [7. Verify your setup](#7-verify-your-setup)
- [Ports at a glance](#ports-at-a-glance)
- [Troubleshooting](#troubleshooting)
- [Next steps](#next-steps)

---

## 1. Prerequisites

| Tool               | Version               | Notes                                                           |
| ------------------ | --------------------- | --------------------------------------------------------------- |
| **Node.js**        | **22** (see `.nvmrc`) | `nvm use` picks it up. The repo requires `>=22`.                |
| **pnpm**           | **11.11.0**           | Pinned via `packageManager`. See install note below.            |
| **Docker Desktop** | latest                | Runs PostgreSQL 15 + Redis 7 locally via `docker compose`.      |
| **Git**            | latest                | —                                                               |
| Expo Go / emulator | —                     | Only for the **mobile** app (iOS Simulator / Android emulator). |

**Installing pnpm.** The supported way is Corepack:

```bash
corepack enable
```

On **Windows**, `corepack enable` can fail with an `EPERM` symlink error. If it
does, install pnpm globally instead and start Docker Desktop by hand:

```bash
npm install -g pnpm@11.11.0
```

External accounts (Google OAuth, Firebase, Sentry, SMTP) are **optional for local
development** — every integration fails soft when its env vars are blank (see
[step 3](#3-environment-variables)). You can boot and use most of the app without
any of them.

---

## 2. Clone & install

```bash
git clone https://github.com/ismetcahangirov/tutora.git
cd tutora
pnpm install          # installs every workspace from the root
```

`pnpm install` runs a `postinstall` that generates the Prisma client for the API.

---

## 3. Environment variables

Copy the example files to real `.env` files. Real `.env` files are gitignored —
**never commit secrets.** The API validates its env at boot (`src/config/env.ts`,
Zod), so a missing required value fails fast with a clear message.

```bash
cp .env.example .env                              # docker-compose + shared defaults
cp apps/tutora-api/.env.example apps/tutora-api/.env
cp apps/tutora/.env.example apps/tutora/.env       # mobile
```

The **admin** and **web** apps read `VITE_API_URL` / `NEXT_PUBLIC_API_URL` and
default to `http://localhost:3000`, so they need no `.env` for a local API.

What's required vs. optional for the API:

| Variable                                  | Required? | Effect when blank                                                                                   |
| ----------------------------------------- | --------- | --------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`, `REDIS_URL`               | **Yes**   | Matches the docker-compose defaults out of the box.                                                 |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | **Yes**   | Any long random string works locally.                                                               |
| `GOOGLE_CLIENT_ID`                        | **Yes**   | Must be non-empty to boot (the example placeholder works); a real ID is needed to actually sign in. |
| `FIREBASE_*`                              | Optional  | Push disabled; in-app notifications still work.                                                     |
| `FIREBASE_STORAGE_BUCKET`                 | Optional  | Upload endpoints return 503; the rest runs.                                                         |
| `SMTP_*`                                  | Optional  | Emails are composed but not delivered (no-op transport).                                            |
| `SENTRY_DSN`                              | Optional  | Error monitoring disabled.                                                                          |

---

## 4. Start the datastores

PostgreSQL 15 and Redis 7 run in Docker. Root scripts wrap `docker compose`:

```bash
pnpm db:up      # start Postgres (:5432) + Redis (:6379) in the background
pnpm db:logs    # follow their logs
pnpm db:down    # stop them
pnpm db:reset   # stop and DELETE the volumes (fresh database)
```

---

## 5. Run the backend

From the root, target the API package with a `--filter`:

```bash
pnpm --filter @tutora/api db:migrate     # apply migrations (creates the schema)
pnpm --filter @tutora/api db:seed        # seed reference/demo data
pnpm --filter @tutora/api dev            # watch mode on http://localhost:3000
```

- REST API: `http://localhost:3000/api/v1`
- **Swagger UI: `http://localhost:3000/docs`**
- Health check: `http://localhost:3000/api/v1/health`

---

## 6. Run a client app

Each app boots independently against the running API. Pick the one you're working
on:

```bash
# Mobile (Expo, Metro on :8081) — then press i (iOS) / a (Android)
pnpm --filter @tutora/mobile start

# Admin panel (Vite on :5173)
pnpm --filter @tutora/admin dev

# Landing page (Next.js; defaults to :3000 — see note)
pnpm --filter @tutora/web dev -- -p 3001
```

> The landing app's `next dev` defaults to port **3000**, which the API also
> uses. Pass `-- -p 3001` (as above) when both run at once.

To start **everything** at once (Turborepo runs each app's `dev` in parallel):

```bash
pnpm dev
```

---

## 7. Verify your setup

The same gates CI enforces, runnable from the root across all workspaces:

```bash
pnpm typecheck      # tsc --noEmit everywhere
pnpm lint           # ESLint everywhere
pnpm test           # unit tests everywhere
pnpm format:check   # Prettier formatting check
pnpm build          # production build of every app
```

Scope any of them to one workspace with `--filter`, e.g.
`pnpm --filter @tutora/api test`.

---

## Ports at a glance

| Service        | URL                          | Started by                           |
| -------------- | ---------------------------- | ------------------------------------ |
| Backend API    | `http://localhost:3000`      | `pnpm --filter @tutora/api dev`      |
| Swagger docs   | `http://localhost:3000/docs` | (part of the API)                    |
| Admin panel    | `http://localhost:5173`      | `pnpm --filter @tutora/admin dev`    |
| Landing page   | `http://localhost:3001`\*    | `pnpm --filter @tutora/web dev`      |
| Mobile (Metro) | `http://localhost:8081`      | `pnpm --filter @tutora/mobile start` |
| PostgreSQL     | `localhost:5432`             | `pnpm db:up`                         |
| Redis          | `localhost:6379`             | `pnpm db:up`                         |

\* Next.js defaults to `:3000`; use `-p 3001` when the API is running.

---

## Troubleshooting

- **`corepack enable` fails with `EPERM` (Windows).** Install pnpm globally
  (`npm install -g pnpm@11.11.0`) and start Docker Desktop manually.
- **API exits at boot complaining about an env var.** The Zod schema in
  `apps/tutora-api/src/config/env.ts` rejects missing/invalid required values —
  read the message; usually a JWT secret or `DATABASE_URL` is missing.
- **`db:migrate` can't reach the database.** Make sure `pnpm db:up` is running
  and healthy (`pnpm db:logs`), and that `DATABASE_URL` matches the compose
  defaults (`postgresql://tutora:tutora@localhost:5432/tutora`).
- **Port already in use.** Something else is on `:3000`/`:5432`/`:6379`. Stop it,
  or override the port in the relevant `.env` (`PORT`, `POSTGRES_PORT`,
  `REDIS_PORT`) and `DATABASE_URL`.
- **`git push` is rejected by the pre-push hook on Windows.** The Turborepo-based
  pre-push gate can be flaky on Windows. Run `pnpm typecheck && pnpm lint`
  yourself and push with `git push --no-verify` once they're green.

---

## Next steps

- **Contributing:** branch, commit, and PR conventions live in
  [`CONTRIBUTING.md`](../CONTRIBUTING.md).
- **Architecture:** the big picture is in [`docs/architecture.md`](architecture.md);
  the reasoning behind major choices is recorded as ADRs in
  [`docs/adr/`](adr/README.md).
- **Testing:** strategy and how to run each suite are in
  [`docs/testing.md`](testing.md).
- **Standards:** [`CLAUDE.md`](../CLAUDE.md) and
  [`.claude/context/`](../.claude/context) hold the full engineering guidelines.
