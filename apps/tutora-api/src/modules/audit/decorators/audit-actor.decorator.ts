import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuditActorContext } from '../audit.types';

/** Truncates a header to a sane length before it is persisted. */
const USER_AGENT_MAX_LENGTH = 512;

/**
 * Builds the {@link AuditActorContext} for the current request from the
 * authenticated principal (`request.user`, set by `JwtAuthGuard`) plus the
 * client IP and user-agent. Use on admin routes that mutate state so
 * `AuditService.record` can attribute the change. On an unauthenticated route
 * the principal is absent and the actor is reported as anonymous.
 */
export const AuditActor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuditActorContext => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const principal = request.user;
    const userAgent = request.headers['user-agent'];

    return {
      id: principal?.id ?? null,
      email: principal?.email ?? 'anonymous',
      ip: request.ip ?? null,
      userAgent: userAgent ? userAgent.slice(0, USER_AGENT_MAX_LENGTH) : null,
    };
  },
);
