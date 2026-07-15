# ADR-0002: Backend as a NestJS modular monolith

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** Tutora core team

## Context

The backend spans many bounded contexts — auth, tutors, students, search,
applications, chat, reviews, billing, notifications, admin, and more. We wanted
clear domain boundaries and testability without paying the operational cost of a
distributed system while the product is still finding its shape.

## Decision

We will build the backend as a **single NestJS application** organized as a
**modular monolith**: one feature module per bounded context, each following
Clean Architecture layering (**presentation → application → domain →
infrastructure**) with dependencies pointing inward.

- Controllers stay thin and delegate to services; business logic lives in the
  application/domain layers; only infrastructure touches Prisma or external SDKs.
- Cross-cutting concerns (JWT/RBAC guards, validation pipe, exception filter,
  Swagger, throttler, cache, i18n, audit) live in `common/` and the bootstrap.
- Modules communicate in-process; nothing crosses a network boundary internally.

Alternatives rejected: **microservices** (premature operational complexity,
distributed transactions, deployment overhead for a small team) and an
**unstructured monolith** (boundaries erode without enforced module seams).

## Consequences

- Strong module boundaries with the deployment simplicity of one process and one
  database.
- NestJS DI, guards, pipes, and testing utilities are used idiomatically across
  the codebase.
- A module can later be extracted into its own service if scale demands it,
  because its boundary is already explicit.
- Cost: everything scales together; a hot path can't be scaled independently
  without first extracting it.
