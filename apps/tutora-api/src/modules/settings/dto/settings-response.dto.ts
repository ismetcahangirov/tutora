import { ApiProperty } from '@nestjs/swagger';

/**
 * Response shapes for the feature-flag and system-setting endpoints. These mirror
 * the `FeatureFlagView` and `SystemSettingView` projections in `settings.types.ts`
 * and exist so Swagger can advertise the response schema — the TypeScript
 * interfaces are erased at compile time and are invisible to the OpenAPI generator.
 */

/** Admin-facing projection of a feature flag. */
export class FeatureFlagViewDto {
  @ApiProperty({ description: 'Feature-flag id.' })
  id!: string;

  @ApiProperty({ description: 'Immutable flag key.', example: 'in_app_payments' })
  key!: string;

  @ApiProperty({ nullable: true, type: String, description: 'Human-readable description, if set.' })
  description!: string | null;

  @ApiProperty({ description: 'Whether the flag is on.', example: true })
  enabled!: boolean;

  @ApiProperty({ description: 'Whole-percentage rollout (0–100).', example: 50 })
  rolloutPercentage!: number;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Id of the admin who last changed the flag, if any.',
  })
  updatedById!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

/** Admin-facing projection of a system setting. */
export class SystemSettingViewDto {
  @ApiProperty({ description: 'System-setting id.' })
  id!: string;

  @ApiProperty({ description: 'Immutable setting key.', example: 'support_email' })
  key!: string;

  @ApiProperty({
    description: 'Stored value; any JSON shape (scalar, array, or object).',
    example: 'support@tutora.app',
  })
  value!: unknown;

  @ApiProperty({ nullable: true, type: String, description: 'Human-readable description, if set.' })
  description!: string | null;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Id of the admin who last changed the setting, if any.',
  })
  updatedById!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}
