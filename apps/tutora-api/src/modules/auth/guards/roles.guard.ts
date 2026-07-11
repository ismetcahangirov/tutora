import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Enforces role-based access on routes annotated with `@Roles(...)`. Runs after
 * `JwtAuthGuard`, so it trusts `request.user`. Fails closed: if roles are
 * required but the principal is absent or has a role outside the allowed set,
 * access is denied with a 403.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<Request>();
    if (!user?.role || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
