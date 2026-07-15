import { ApiProperty } from '@nestjs/swagger';
import { AuthProvider, UserRole } from '@prisma/client';

/**
 * Response shapes for the users endpoints. These mirror the interfaces in
 * `users.types.ts` (`UserSummary`, `AdminUserView`) and exist so Swagger can
 * advertise the response schema — the TypeScript interfaces are erased at
 * compile time and are invisible to the OpenAPI generator.
 */

/**
 * Public, non-sensitive projection of a user returned by profile endpoints such
 * as `GET /users/me`. Excludes credentials and internal linkage fields.
 */
export class UserSummaryDto {
  @ApiProperty({ description: 'User id.' })
  id!: string;

  @ApiProperty({ description: 'Account email.' })
  email!: string;

  @ApiProperty({ nullable: true, type: String, description: 'Display name, if set.' })
  name!: string | null;

  @ApiProperty({ nullable: true, type: String, description: 'Avatar URL, if set.' })
  avatarUrl!: string | null;

  @ApiProperty({
    enum: UserRole,
    enumName: 'UserRole',
    nullable: true,
    description: 'Selected role; null until onboarding assigns one.',
  })
  role!: UserRole | null;

  @ApiProperty({ description: 'Whether the user has completed onboarding.' })
  onboardingCompleted!: boolean;
}

/**
 * Fuller projection returned by admin user-management endpoints. Still omits
 * internal linkage (e.g. `googleId`) but exposes lifecycle and audit fields an
 * administrator needs.
 */
export class AdminUserViewDto {
  @ApiProperty({ description: 'User id.' })
  id!: string;

  @ApiProperty({ description: 'Account email.' })
  email!: string;

  @ApiProperty({ description: 'Whether the email has been verified.' })
  emailVerified!: boolean;

  @ApiProperty({ nullable: true, type: String, description: 'Display name, if set.' })
  name!: string | null;

  @ApiProperty({ nullable: true, type: String, description: 'Avatar URL, if set.' })
  avatarUrl!: string | null;

  @ApiProperty({ nullable: true, type: String, description: 'Preferred locale, if set.' })
  locale!: string | null;

  @ApiProperty({
    enum: AuthProvider,
    enumName: 'AuthProvider',
    description: 'Identity provider the account is linked to.',
  })
  provider!: AuthProvider;

  @ApiProperty({
    enum: UserRole,
    enumName: 'UserRole',
    nullable: true,
    description: 'Assigned role; null until onboarding assigns one.',
  })
  role!: UserRole | null;

  @ApiProperty({ description: 'Whether the user has completed onboarding.' })
  onboardingCompleted!: boolean;

  @ApiProperty({
    format: 'date-time',
    nullable: true,
    type: String,
    description: 'When the account was soft-deleted, if it has been.',
  })
  deletedAt!: string | null;

  @ApiProperty({ format: 'date-time', type: String })
  createdAt!: string;

  @ApiProperty({ format: 'date-time', type: String })
  updatedAt!: string;
}
