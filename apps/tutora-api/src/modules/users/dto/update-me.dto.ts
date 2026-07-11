import { UserRole } from '@prisma/client';
import { IsIn } from 'class-validator';

/**
 * Roles a user may assign to themselves during onboarding (#23). ADMIN is
 * granted out-of-band and is never self-selectable — presenting it fails
 * validation (400) so privilege escalation cannot happen through this endpoint.
 */
export const SELECTABLE_ROLES: readonly UserRole[] = [UserRole.STUDENT, UserRole.TUTOR];

/** Body of `PATCH /api/v1/users/me` — the onboarding role choice. */
export class UpdateMeDto {
  @IsIn(SELECTABLE_ROLES as UserRole[], {
    message: `role must be one of the following values: ${SELECTABLE_ROLES.join(', ')}`,
  })
  role!: UserRole;
}
