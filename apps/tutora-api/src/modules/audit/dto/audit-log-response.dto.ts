import { ApiProperty } from '@nestjs/swagger';
import { AuditCategory } from '@prisma/client';

/**
 * Response shape for the audit-log listing endpoint. Mirrors the `AuditLogView`
 * projection in `audit.types.ts` and exists so Swagger can advertise the response
 * schema — the TypeScript interface is erased at compile time and is invisible to
 * the OpenAPI generator.
 */

/** Admin-facing projection of an audit-log row. */
export class AuditLogViewDto {
  @ApiProperty({ description: 'Audit-log entry id.' })
  id!: string;

  @ApiProperty({ enum: AuditCategory, enumName: 'AuditCategory' })
  category!: AuditCategory;

  @ApiProperty({ description: 'Dot-namespaced verb, e.g. `feature_flag.updated`.' })
  action!: string;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Actor user id; null for unauthenticated (anonymous) events.',
  })
  actorId!: string | null;

  @ApiProperty({ description: 'Actor email, always captured for a human-readable trail.' })
  actorEmail!: string;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Affected resource type, when the action targets one.',
  })
  entityType!: string | null;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Affected resource id, when the action targets one.',
  })
  entityId!: string | null;

  @ApiProperty({
    type: 'object',
    nullable: true,
    additionalProperties: true,
    description: 'Optional structured payload (e.g. the changed fields).',
  })
  metadata!: unknown;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Originating IP address, if captured.',
  })
  ip!: string | null;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Originating user agent, if captured.',
  })
  userAgent!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;
}
