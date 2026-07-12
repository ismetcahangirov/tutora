import type { ConnectionOptions } from 'bullmq';

const DEFAULT_REDIS_PORT = 6379;

/**
 * Derives BullMQ Redis connection options from the validated `REDIS_URL`.
 *
 * Passing plain options (rather than a shared ioredis instance) lets BullMQ own
 * the connection lifecycle and apply the settings a blocking worker requires
 * (e.g. `maxRetriesPerRequest: null`). Supports `redis://` and TLS `rediss://`,
 * with optional user/password and a database index in the path.
 */
export function redisConnectionOptions(redisUrl: string): ConnectionOptions {
  const url = new URL(redisUrl);
  const database = url.pathname.replace(/^\//, '');

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : DEFAULT_REDIS_PORT,
    ...(url.username ? { username: decodeURIComponent(url.username) } : {}),
    ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
    ...(database ? { db: Number(database) } : {}),
    ...(url.protocol === 'rediss:' ? { tls: {} } : {}),
  };
}
