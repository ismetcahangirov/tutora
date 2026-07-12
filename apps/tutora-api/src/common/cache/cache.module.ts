import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';

/**
 * Exposes {@link CacheService} app-wide. `@Global` so feature modules can cache
 * hot reads without re-importing; the underlying Redis client comes from the
 * global `RedisModule`.
 */
@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
