# Architecture Decision Records

An **Architecture Decision Record (ADR)** captures a single significant
architectural choice: the context that forced a decision, the decision itself,
and the consequences we accept. ADRs make the _why_ durable — long after the
people who made a call have moved on.

We use a lightweight [MADR](https://adr.github.io/madr/)-style format. See
[`0000-template.md`](0000-template.md).

## Index

| ADR                                             | Title                                                 | Status   |
| ----------------------------------------------- | ----------------------------------------------------- | -------- |
| [0001](0001-monorepo-pnpm-turborepo.md)         | Monorepo with pnpm workspaces and Turborepo           | Accepted |
| [0002](0002-backend-modular-monolith-nestjs.md) | Backend as a NestJS modular monolith                  | Accepted |
| [0003](0003-postgresql-prisma.md)               | PostgreSQL with Prisma as the system of record        | Accepted |
| [0004](0004-redis-bullmq.md)                    | Redis for caching, BullMQ for background jobs         | Accepted |
| [0005](0005-auth-google-oauth-jwt.md)           | Google OAuth sign-in with rotating JWT refresh tokens | Accepted |
| [0006](0006-mobile-expo-tanstack-query.md)      | Mobile on Expo with TanStack Query state model        | Accepted |
| [0007](0007-internationalization.md)            | First-class internationalization (az/en/ru)           | Accepted |

## Process

1. **Propose.** Copy [`0000-template.md`](0000-template.md) to
   `NNNN-short-kebab-title.md` (next number, zero-padded). Open it with status
   **Proposed** in your PR.
2. **Decide.** Discussion happens on the PR. On merge the status becomes
   **Accepted**.
3. **Don't rewrite history.** An ADR is immutable once accepted. If a decision
   changes, write a new ADR that **supersedes** the old one and update both
   `Status` fields (`Superseded by NNNN` / `Supersedes NNNN`).

ADRs numbered here are **retroactive** — they document foundational decisions
already in force so the rationale is written down. New significant decisions get a
new ADR going forward.

## When does a decision deserve an ADR?

Write one when the choice is **hard to reverse** or **broadly constraining**:
persistence engines, framework/runtime picks, auth models, cross-cutting patterns,
public API contracts. Skip it for routine, local, easily-reversed choices.
