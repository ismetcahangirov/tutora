# ADR-0004: Redis for caching, BullMQ for background jobs

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** Tutora core team

## Context

Some endpoints are read-heavy and tolerate slight staleness (taxonomy, search).
Some work should happen off the request path (push notifications, digests,
expiring stale applications, session cleanup). And auth endpoints need
brute-force protection. All three call for an in-memory store with pub/sub and
atomic primitives.

## Decision

We will run a single **Redis** instance and use it for three purposes:

1. **Cache-aside** for read-heavy endpoints via a fail-soft `CacheService` — a
   Redis outage degrades to direct database reads rather than an error.
2. **Background jobs** with **BullMQ**: the `jobs` module owns a queue and a cron
   scheduler for cleanup, application expiry, and tutor digests.
3. **Rate limiting** as the storage backend for `@nestjs/throttler` (e.g. auth
   endpoints), so limits hold across instances.

A shared, lazily-connected Redis client is provided through DI. Local development
runs Redis 7 via docker-compose.

Alternatives rejected: an **in-process cache/queue** (doesn't survive restarts or
scale horizontally) and a **dedicated broker** like RabbitMQ/SQS (extra
infrastructure we don't yet need — Redis already covers cache, queue, and
throttling).

## Consequences

- One dependency covers caching, queues, and rate limiting.
- Workers run in the same NestJS process today and can be split into a separate
  worker process later without changing the queue contract.
- Fail-soft caching keeps the API available during a Redis blip.
- Cost: Redis is a shared point of load; heavy queue and cache traffic must be
  monitored, and durability of queued jobs is bounded by Redis persistence
  settings.
