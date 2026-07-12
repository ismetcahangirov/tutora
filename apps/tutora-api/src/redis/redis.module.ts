import { Global, Inject, Logger, Module, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

const MAX_RECONNECT_DELAY_MS = 2_000;
const RECONNECT_STEP_MS = 200;

/**
 * Provides the process-wide ioredis client (the {@link REDIS_CLIENT} token),
 * shared by the Redis cache and the rate limiter. `@Global` so any module can
 * inject it without re-importing.
 *
 * The client is lazy: it connects on first command, so booting the app (or a
 * partial test module) never blocks on Redis. A bounded reconnect strategy keeps
 * a downed Redis from hanging commands indefinitely — the cache degrades to a
 * miss (see `CacheService`) rather than failing the request.
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis =>
        new Redis(config.getOrThrow<string>('REDIS_URL'), {
          lazyConnect: true,
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => Math.min(times * RECONNECT_STEP_MS, MAX_RECONNECT_DELAY_MS),
        }),
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  private readonly logger = new Logger(RedisModule.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /** Closes the connection on shutdown. `quit` drains in-flight commands when
   * connected; otherwise `disconnect` avoids forcing a connect just to close. */
  async onModuleDestroy(): Promise<void> {
    if (this.redis.status === 'ready') {
      await this.redis.quit();
    } else {
      this.redis.disconnect();
    }
    this.logger.log('Redis connection closed');
  }
}
