import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '@/redis/redis.constants';
import { HttpThrottlerGuard } from './http-throttler.guard';
import { buildThrottlerOptions } from './throttler.config';

/**
 * Wires global rate limiting. Registers a Redis-backed {@link ThrottlerModule}
 * and binds {@link HttpThrottlerGuard} as an `APP_GUARD`, so every HTTP route is
 * limited by default. Routes opt out with `@SkipThrottle()` (e.g. health probes)
 * or tighten the budget with `@Throttle()` (e.g. auth).
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [REDIS_CLIENT],
      useFactory: (redis: Redis) => buildThrottlerOptions(redis),
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: HttpThrottlerGuard }],
})
export class ThrottlingModule {}
