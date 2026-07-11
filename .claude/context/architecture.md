# Tutora — System Architecture

## Overview

Tutora is composed of four independent deployable units that communicate over a shared REST API:

| Unit         | Repo           | Runtime             |
| ------------ | -------------- | ------------------- |
| Mobile App   | `tutora`       | React Native / Expo |
| Admin Panel  | `tutora-admin` | React + Vite (SPA)  |
| Landing Page | `tutora-web`   | Next.js (SSG/SSR)   |
| Backend API  | `tutora-api`   | Node.js / NestJS    |

---

## High-Level System Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                               │
│                                                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │   Mobile App     │  │   Admin Panel    │  │  Landing Page   │  │
│  │  (React Native   │  │  (React + Vite)  │  │   (Next.js)     │  │
│  │   + Expo)        │  │                  │  │   SSG / SSR     │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬────────┘  │
└───────────┼──────────────────────┼─────────────────────┼───────────┘
            │  HTTPS / REST        │  HTTPS / REST        │ (static)
            ▼                      ▼                      ▼
┌────────────────────────────────────────────────────────────────────┐
│                       GATEWAY LAYER (Nginx)                        │
│           TLS termination · Rate limiting · Load balancing         │
└───────────────────────────────┬────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                    BACKEND API  (NestJS)                           │
│                                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │  Auth    │ │  Users   │ │  Tutors  │ │ Students │             │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │  Search  │ │  Applic. │ │  Reviews │ │   Chat   │             │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ Notific. │ │ Payments │ │  Admin   │ │  Media   │             │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Cross-cutting infrastructure                    │  │
│  │  JWT Guard · RBAC Guard · Validation Pipe · Logger (pino)   │  │
│  │  Exception Filter · Swagger · Throttler · Cache Interceptor │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───────────────┬───────────────────────────┬────────────────────────┘
                │                           │
        ┌───────▼──────┐           ┌────────▼──────┐
        │  PostgreSQL  │           │     Redis      │
        │  (Prisma ORM)│           │  Cache / Queue │
        └──────────────┘           └────────────────┘
                                           │
                                   ┌───────▼───────┐
                                   │   BullMQ      │
                                   │  (Job Queue)  │
                                   └───────────────┘
                                           │
                             ┌─────────────▼────────────┐
                             │  External Services        │
                             │  Firebase · Google OAuth  │
                             │  Cloud Storage · FCM      │
                             └──────────────────────────┘
```

---

## Layered / Clean Architecture (per service)

Each NestJS module follows a strict four-layer pattern. Dependencies point inward only.

```
┌─────────────────────────────────────┐
│          Presentation Layer         │  Controllers, DTOs, Guards, Pipes
├─────────────────────────────────────┤
│          Application Layer          │  Services, Use Cases, Commands
├─────────────────────────────────────┤
│           Domain Layer              │  Entities, Value Objects, Interfaces
├─────────────────────────────────────┤
│        Infrastructure Layer         │  Repositories (Prisma), Adapters,
│                                     │  External clients (Firebase, etc.)
└─────────────────────────────────────┘
```

**Rule:** A layer may only import from layers below it. Controllers never access repositories directly.

---

## Backend Module Boundaries

### `auth`

Responsibilities: registration, login, JWT issuance, refresh token rotation, Google OAuth, token blacklisting (Redis), logout.

### `users`

Base profile data shared across roles (name, email, phone, avatar, locale, device token). Handles profile updates and avatar upload delegation to `media`.

### `tutors`

Tutor-specific profile: subjects, hourly rates, availability, districts, languages, portfolio. Tutor onboarding flow, verification status.

### `students`

Student/parent profile: subject interests, budget preference, saved tutors.

### `search`

Stateless full-text + filter query over tutors. Reads a denormalized Redis cache (refreshed on tutor profile updates). Filters: subject, district, price range, rating, online/offline, language. Returns paginated, sorted results.

### `applications`

A student submits an application to a tutor. State machine: `PENDING → ACCEPTED | REJECTED | CANCELLED → COMPLETED`. Triggers notifications on state change.

### `reviews`

Students leave a rating (1–5) and text review after a completed session. Tutor aggregate rating recomputed on each review write (or via Cron).

### `chat`

Real-time messaging between student and tutor after application acceptance. Messages persisted to PostgreSQL. WebSocket gateway (Socket.IO) via NestJS Gateway decorator. Redis Pub/Sub for horizontal scalability.

### `notifications`

Sends push notifications via FCM (Firebase Cloud Messaging). Consumes events from BullMQ queues. Manages device token registration and per-user notification preferences.

### `payments`

Records payment intents, handles payment confirmation webhooks from payment gateway, stores transaction history. (Phase 2 feature.)

### `admin`

RBAC-protected endpoints for the admin panel: user management, tutor verification, content moderation, analytics aggregation, system configuration.

### `media`

Handles file upload to Cloud Storage (signed URLs or direct upload). Returns CDN URLs. Used by `users`, `tutors`, and `chat` modules.

---

## Data Flow

### Student Search Flow

```
Mobile ──[GET /search?subject=Math&district=Baku&minPrice=10]──▶ API
         ◀──── cached results (Redis, TTL 5 min) ────────────────
         if cache miss:
           API ──▶ PostgreSQL (filtered + sorted query)
           API ──▶ Redis SET (result, TTL 5 min)
           API ──▶ Mobile
```

### Application Flow

```
Student ──[POST /applications]──▶ API
  API writes application (status=PENDING) to PostgreSQL
  API enqueues notification job ──▶ BullMQ
  BullMQ worker ──▶ FCM ──▶ Tutor device

Tutor ──[PATCH /applications/:id { action: "accept" }]──▶ API
  API updates status=ACCEPTED
  API enqueues notification job ──▶ BullMQ
  BullMQ worker ──▶ FCM ──▶ Student device
  Chat room created for this pair
```

---

## Caching Strategy (Redis)

| Cache Key Pattern       | TTL               | Invalidation Trigger    |
| ----------------------- | ----------------- | ----------------------- |
| `search:{hash(params)}` | 5 min             | Tutor profile update    |
| `tutor:{id}:profile`    | 10 min            | Tutor profile update    |
| `user:{id}:session`     | Refresh token TTL | Logout / token rotation |
| `blacklist:token:{jti}` | Token expiry      | Logout                  |
| `rating:{tutorId}`      | 30 min            | New review written      |

Cache-aside pattern: API checks Redis first; on miss reads from PostgreSQL and writes to Redis.

---

## Background Jobs (BullMQ)

All queues are backed by Redis. Workers run in the same NestJS process (separate process in production recommended).

| Queue           | Job                  | Trigger                                                 |
| --------------- | -------------------- | ------------------------------------------------------- |
| `notifications` | `send-push`          | Application state changes, new message, review received |
| `email`         | `send-email`         | Registration welcome, application confirmation          |
| `media`         | `process-image`      | Avatar/portfolio image uploaded (resize + CDN push)     |
| `ratings`       | `recalculate-rating` | New review written                                      |
| `cleanup`       | `expire-sessions`    | Cron: nightly — purge expired refresh tokens            |
| `search`        | `reindex-tutor`      | Tutor profile updated — invalidate + warm cache         |

---

## Authentication Flow (JWT + Refresh Tokens)

```
Client ──[POST /auth/login { email, password }]──▶ API
  API validates credentials
  API issues:
    access_token  (JWT, 15 min, stateless)
    refresh_token (opaque, 7 days, stored in PostgreSQL hashed)
  Response: { access_token, refresh_token }

Client stores:
  access_token  → MMKV (in-memory, not encrypted disk)
  refresh_token → expo-secure-store (encrypted keychain)

Authenticated request:
  Client ──[Authorization: Bearer <access_token>]──▶ API
  JwtGuard validates signature + expiry
  RolesGuard checks role claim in payload

Token refresh:
  Client detects 401 ──▶ [POST /auth/refresh { refresh_token }]
  API: hash refresh_token, look up in DB, check expiry
  API: rotate — delete old, issue new refresh_token
  API: issue new access_token
  Client: store new tokens silently

Logout:
  Client ──[POST /auth/logout]──▶ API
  API: delete refresh_token from DB
  API: add access_token jti to Redis blacklist (until its natural expiry)
```

---

## Feature-First Folder Structure

### Mobile (`tutora/`)

```
src/
  features/
    auth/
      components/
      hooks/
      screens/
      services/
      types/
      index.ts          ← barrel export
    search/
    tutor-profile/
    applications/
    chat/
    notifications/
    reviews/
    profile/
  shared/
    components/         ← design system atoms
    hooks/
    lib/                ← axios, i18n, mmkv, query-client
    types/
    utils/
    constants/
  app/                  ← Expo Router file-based routing
```

### API (`tutora-api/`)

```
src/
  modules/
    auth/
      auth.controller.ts
      auth.service.ts
      auth.module.ts
      dto/
      guards/
      strategies/
    users/
    tutors/
    search/
    ...
  common/
    decorators/
    filters/
    guards/
    interceptors/
    pipes/
    utils/
  prisma/
    schema.prisma
    migrations/
  config/
  main.ts
```

**Rationale:** Feature-first groups all code for a vertical slice in one directory. A developer working on "applications" touches only `features/applications/` on the frontend and `modules/applications/` on the backend. This minimizes cognitive overhead, avoids cross-feature coupling, and makes feature deletion or extraction trivial.
