import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Redis } from 'ioredis';
import { GLOBAL_THROTTLE } from './throttle.constants';
import { buildThrottlerOptions } from './throttler.config';

describe('buildThrottlerOptions', () => {
  // A lazy client is a real ioredis instance (so the storage's `instanceof` check
  // treats it as a shared connection) that never actually dials Redis.
  let redis: Redis;

  beforeAll(() => {
    redis = new Redis({ lazyConnect: true });
  });

  afterAll(() => {
    redis.disconnect();
  });

  it('registers the default throttler with the global window and limit', () => {
    const options = buildThrottlerOptions(redis);

    expect(options).toMatchObject({
      throttlers: [{ name: 'default', ttl: GLOBAL_THROTTLE.ttl, limit: GLOBAL_THROTTLE.limit }],
      setHeaders: true,
    });
  });

  it('backs the limiter with Redis storage over the shared connection', () => {
    const options = buildThrottlerOptions(redis) as unknown as {
      storage: ThrottlerStorageRedisService;
    };

    const storage = options.storage;
    expect(storage).toBeInstanceOf(ThrottlerStorageRedisService);
    // Reuses our client — it did not open its own connection.
    expect(storage.redis).toBe(redis);
    expect(storage.disconnectRequired).toBeUndefined();
  });
});
