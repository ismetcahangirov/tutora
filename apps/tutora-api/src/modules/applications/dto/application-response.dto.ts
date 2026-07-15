import { ApiProperty } from '@nestjs/swagger';
import { ApplicationStatus, LessonFormat } from '@prisma/client';

/**
 * Response shapes for the applications endpoints. These mirror the projections
 * built in `applications.mapper.ts` (`ApplicationView` & friends) and exist so
 * Swagger can advertise the response schema — the TypeScript interfaces are
 * erased at compile time and are invisible to the OpenAPI generator.
 */

/** Minimal party projection (student or tutor) shown on an application. */
export class ApplicationPartyDto {
  @ApiProperty({ description: 'Party user id.' })
  id!: string;

  @ApiProperty({ nullable: true, type: String, description: 'Display name, if set.' })
  name!: string | null;

  @ApiProperty({ nullable: true, type: String, description: 'Avatar URL, if set.' })
  avatarUrl!: string | null;
}

/** Subject a student applied for, when one was specified. */
export class ApplicationSubjectDto {
  @ApiProperty({ description: 'Subject id.' })
  id!: string;

  @ApiProperty({ description: 'Localized subject name.' })
  name!: string;

  @ApiProperty({ description: 'URL-safe subject slug.' })
  slug!: string;
}

/**
 * Application projection returned to both parties. Contains the counterpart's
 * public identity — a student sees the tutor, a tutor sees the applicant.
 */
export class ApplicationViewDto {
  @ApiProperty({ description: 'Application id.' })
  id!: string;

  @ApiProperty({ enum: ApplicationStatus, enumName: 'ApplicationStatus' })
  status!: ApplicationStatus;

  @ApiProperty({ nullable: true, type: String, description: 'Applicant’s message, if any.' })
  message!: string | null;

  @ApiProperty({
    enum: LessonFormat,
    enumName: 'LessonFormat',
    nullable: true,
    description: 'Requested lesson format, if specified.',
  })
  format!: LessonFormat | null;

  @ApiProperty({ type: ApplicationSubjectDto, nullable: true })
  subject!: ApplicationSubjectDto | null;

  @ApiProperty({ type: ApplicationPartyDto })
  student!: ApplicationPartyDto;

  @ApiProperty({ type: ApplicationPartyDto })
  tutor!: ApplicationPartyDto;

  @ApiProperty({
    format: 'date-time',
    nullable: true,
    type: String,
    description: 'When the tutor responded, if they have.',
  })
  respondedAt!: string | null;

  @ApiProperty({ format: 'date-time', type: String })
  createdAt!: string;

  @ApiProperty({ format: 'date-time', type: String })
  updatedAt!: string;
}
