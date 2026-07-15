# ADR-0003: PostgreSQL with Prisma as the system of record

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** Tutora core team

## Context

Tutora's core data is highly relational — users, tutor and student profiles,
applications with a state machine, reviews, chat threads, subscriptions, taxonomy,
and audit logs — and much of it must be queried with filters, joins, and
aggregates (e.g. tutor search, dashboard analytics). We needed a durable,
transactional store and a type-safe access layer that fits the TypeScript stack.

## Decision

We will use **PostgreSQL** as the single system of record, accessed exclusively
through **Prisma**.

- The schema and migrations are versioned in `apps/tutora-api/prisma/`.
- Prisma generates a fully typed client; no raw string SQL — queries are
  parameterized, which also closes off SQL injection.
- Relations are loaded deliberately with `select`/`include` to avoid N+1s, and
  filter/sort columns are indexed.
- Local development runs Postgres 15 via docker-compose; migrations are applied
  with `prisma migrate` and demo data with a seed script.

Alternatives rejected: a **NoSQL document store** (poor fit for our relational,
multi-entity queries and transactional state changes) and a **raw query builder**
(loses end-to-end type safety and migration ergonomics).

## Consequences

- End-to-end type safety from the database to the service layer.
- Migrations are reviewable, versioned, and reproducible in CI and production.
- Strong transactional guarantees for multi-row state changes (applications,
  token rotation, billing).
- Costs: Prisma is the single abstraction over the DB, so we live within its
  query model; some complex analytics may need raw SQL escapes or materialized
  views later.
