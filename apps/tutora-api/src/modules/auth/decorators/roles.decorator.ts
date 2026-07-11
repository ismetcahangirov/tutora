import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@prisma/client';

/** Metadata key under which `@Roles(...)` stores the allowed roles. */
export const ROLES_KEY = 'roles';

/**
 * Restricts a route (or every route on a controller) to the given roles.
 * Enforced by `RolesGuard`, which reads this metadata via the `Reflector`.
 */
export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
