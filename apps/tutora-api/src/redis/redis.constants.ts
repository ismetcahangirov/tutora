/**
 * DI token for the shared ioredis client. A single connection is created from
 * `REDIS_URL` and reused by the cache and the rate limiter (BullMQ owns its own
 * connection so a blocking worker cannot starve request-path commands).
 */
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
