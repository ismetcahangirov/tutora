import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../types/auth.types';

/**
 * Injects the authenticated principal (`request.user`) that `JwtAuthGuard`
 * attached. Only use on routes protected by `JwtAuthGuard`; on unguarded
 * routes the value is `undefined`.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user;
  },
);
