import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '@/redis/redis.constants';

const SCAN_BATCH_SIZE = 100;

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Thin JSON cache over the shared Redis client for hot, read-heavy data.
 *
 * Every operation fails soft: if Redis is unreachable, reads report a miss and
 * writes are dropped (logged, never thrown) so a cache outage degrades to hitting
 * the source of truth instead of taking down the request. Values are JSON-encoded,
 * so callers get back plain data — not Redis strings.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /** Returns the cached value, or `null` on a miss (or any Redis error). */
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch (error) {
      this.logger.warn(`Cache read failed for "${key}": ${toMessage(error)}`);
      return null;
    }
  }

  /** Stores a value with a per-key TTL (seconds). Silently drops on failure. */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(`Cache write failed for "${key}": ${toMessage(error)}`);
    }
  }

  /**
   * Cache-aside read: returns the cached value on a hit, otherwise runs `loader`,
   * caches its result under `key` for `ttlSeconds`, and returns it. `loader`
   * errors propagate (a failed load must not be cached).
   */
  async getOrSet<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    const value = await loader();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  /** Deletes the given keys (no-op when none are passed). */
  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }
    try {
      await this.redis.del(...keys);
    } catch (error) {
      this.logger.warn(`Cache delete failed: ${toMessage(error)}`);
    }
  }

  /**
   * Invalidates every key under a prefix. Uses a non-blocking `SCAN` cursor
   * (never `KEYS`, which blocks the whole Redis server) so it is safe on a large
   * keyspace. Best-effort: a mid-scan failure is logged, not thrown.
   */
  async deleteByPrefix(prefix: string): Promise<void> {
    try {
      const stream = this.redis.scanStream({ match: `${prefix}*`, count: SCAN_BATCH_SIZE });
      for await (const batch of stream) {
        const keys = batch as string[];
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
    } catch (error) {
      this.logger.warn(`Cache invalidation failed for prefix "${prefix}": ${toMessage(error)}`);
    }
  }
}
