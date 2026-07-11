import { SetMetadata } from '@nestjs/common';

/** Metadata key marking a route as publicly accessible (skips `JwtAuthGuard`). */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route (or controller) as public so `JwtAuthGuard` allows it through
 * without an `Authorization` header. Use sparingly and deliberately.
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
