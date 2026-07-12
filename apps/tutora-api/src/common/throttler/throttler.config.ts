import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import type { Redis } from 'ioredis';
import { DEFAULT_THROTTLER, GLOBAL_THROTTLE } from './throttle.constants';

/**
 * Builds the throttler options backed by the shared Redis client.
 *
 * Redis-backed storage is deliberate: an in-memory limiter counts per process, so
 * N horizontally-scaled instances would let a client burst N× the intended limit.
 * A shared counter enforces one global budget. `setHeaders` emits the standard
 * `RateLimit-*` / `Retry-After` headers so clients can back off gracefully.
 */
export function buildThrottlerOptions(redis: Redis): ThrottlerModuleOptions {
  return {
    throttlers: [
      { name: DEFAULT_THROTTLER, ttl: GLOBAL_THROTTLE.ttl, limit: GLOBAL_THROTTLE.limit },
    ],
    storage: new ThrottlerStorageRedisService(redis),
    setHeaders: true,
    errorMessage: 'Too many requests. Please slow down and try again shortly.',
  };
}
