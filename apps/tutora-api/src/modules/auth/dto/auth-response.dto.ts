import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

/**
 * Response shapes for the auth endpoints. These mirror the interfaces in
 * `auth.types.ts` (`AuthTokens`, `AuthUserSummary`, `AuthResponse`) and exist so
 * Swagger can advertise the response schema — the TypeScript interfaces are
 * erased at compile time and are invisible to the OpenAPI generator.
 */

/** The token pair issued on sign-in and rotated on refresh. */
export class AuthTokensDto {
  @ApiProperty({ description: 'Short-lived JWT presented as a bearer token.' })
  accessToken!: string;

  @ApiProperty({ description: 'Long-lived, rotated token used to obtain a new pair.' })
  refreshToken!: string;
}

/** Non-sensitive identity of the authenticated user, returned on sign-in. */
export class AuthUserSummaryDto {
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

/** Sign-in result: the token pair plus the authenticated user summary. */
export class AuthResponseDto extends AuthTokensDto {
  @ApiProperty({ type: AuthUserSummaryDto })
  user!: AuthUserSummaryDto;
}
