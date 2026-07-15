# Architecture Overview

The current-state, factual map of how Tutora is built. For the reasoning behind
the major choices, see the [Architecture Decision Records](adr/README.md). For
deeper diagrams (data flows, caching keys, queue tables, the auth sequence) see
[`.claude/context/architecture.md`](../.claude/context/architecture.md).

## Deployable units

Tutora is a **pnpm + Turborepo monorepo** with four independently deployable apps
and one shared package:

| Unit          | Path                | Stack                                |
| ------------- | ------------------- | ------------------------------------ |
| Backend API   | `apps/tutora-api`   | NestJS · Prisma · PostgreSQL · Redis |
| Mobile app    | `apps/tutora`       | React Native · Expo · Expo Router    |
| Admin panel   | `apps/tutora-admin` | React · Vite (SPA) · shadcn/ui       |
| Landing page  | `apps/tutora-web`   | Next.js (SSG/ISR)                    |
| Shared config | `packages/config`   | Prettier / ESLint / tsconfig base    |

All clients talk to the backend over the same versioned REST API
(`/api/v1/...`), documented with Swagger at `/docs`. The mobile app additionally
holds a Socket.IO connection for real-time chat.

```
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Mobile app   │   │  Admin panel  │   │ Landing page  │
│ (Expo / RN)   │   │ (React+Vite)  │   │  (Next.js)    │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │ REST + WS         │ REST              │ REST
        └──────────────┬────┴───────────────────┘
                       ▼
             ┌────────────────────┐
             │   Backend API      │  NestJS modular monolith
             │  (REST + Socket.IO)│
             └─────────┬──────────┘
             ┌─────────┴──────────┐
             ▼                    ▼
      ┌────────────┐        ┌────────────┐
      │ PostgreSQL │        │   Redis    │  cache · BullMQ queues · throttler
      │  (Prisma)  │        └────────────┘
      └────────────┘
                       ▼ (optional, fail-soft)
        Google OAuth · Firebase (FCM + Cloud Storage) · SMTP · Sentry
```

## Backend: modular monolith

The API is a single NestJS process organized **feature-first**, one module per
bounded context. Modules present today:

`applications` · `audit` · `auth` · `billing` · `chat` · `cms` · `dashboard` ·
`health` · `jobs` · `mail` · `media` · `notifications` · `reviews` · `search` ·
`settings` · `students` · `taxonomy` · `translations` · `tutors` · `users`

Each module follows Clean Architecture layering — **presentation → application →
domain → infrastructure** — with dependencies pointing inward: controllers
delegate to services, services own business logic, and only the infrastructure
layer touches Prisma or external SDKs.

Cross-cutting concerns live in `common/` and the app bootstrap:

- **AuthN/AuthZ** — JWT access-token guard + `RolesGuard` (RBAC), fail-closed.
- **Validation** — global `ValidationPipe` with class-validator DTOs and
  i18n-aware error formatting.
- **Errors** — a global exception filter maps errors to a consistent JSON shape.
- **Docs** — Swagger/OpenAPI at `/docs` (`src/swagger.ts`).
- **Resilience** — `@nestjs/throttler` rate limiting and a fail-soft Redis
  `CacheService`.
- **i18n** — request-scoped localization (`az` default, `en`, `ru`).
- **Auditing** — a reusable, fail-soft audit module records privileged actions.

> The module list above is the source of truth. Some older narrative docs mention
> a `payments` module and email/password login; the implementation uses the
> `billing` module and **Google-OAuth-only** sign-in.

## Data & infrastructure

- **PostgreSQL** via **Prisma** is the system of record. Schema and migrations
  live in `apps/tutora-api/prisma/`.
- **Redis** backs three things: the cache-aside layer for read-heavy endpoints
  (e.g. taxonomy, search), the **BullMQ** queues + cron scheduler
  (`jobs` module: cleanup, application expiry, digests), and throttler storage.
- **Firebase** provides Cloud Messaging (push) and Cloud Storage (signed avatar /
  certificate uploads). Both are optional and disabled when unconfigured.

## Authentication

Google OAuth is the only sign-in method. The mobile client obtains a Google
`idToken`, the API verifies it, then issues a short-lived **JWT access token** and
a long-lived **refresh token** that is hashed at rest and **rotated** on every
refresh (with reuse detection). Access tokens are validated statelessly by the
JWT guard; roles are checked by `RolesGuard`. See
[ADR-0005](adr/0005-auth-google-oauth-jwt.md).

## Clients

- **Mobile** (`apps/tutora`) — Expo Router (file-based routing under `src/app`),
  feature-first `src/features/*`. Server state via **TanStack Query**; local UI
  state via **Zustand**; persistence via **MMKV**; secure tokens via Expo Secure
  Store. See [ADR-0006](adr/0006-mobile-expo-tanstack-query.md).
- **Admin** (`apps/tutora-admin`) — Vite SPA with shadcn/ui, TanStack Table/Query,
  and role-gated routes.
- **Landing** (`apps/tutora-web`) — Next.js, SEO-first, statically generated, with
  `next-intl` localization.

## Internationalization

Every user-facing surface ships `az` (default), `en`, and `ru`. The mobile app
uses `i18next`, the landing app uses `next-intl`, and the API localizes
validation/error messages. Translation keys are dot-namespaced and can be edited
from the admin CMS. See [ADR-0007](adr/0007-internationalization.md).

## Related documents

- [ADRs](adr/README.md) — why the above was chosen.
- [Onboarding](onboarding.md) — how to run it locally.
- [Testing](testing.md) · [Deployment](deployment.md) · [Monitoring](monitoring.md).
- [`.claude/context/architecture.md`](../.claude/context/architecture.md) —
  extended diagrams and data-flow walkthroughs.
