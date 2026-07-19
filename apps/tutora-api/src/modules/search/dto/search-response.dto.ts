import { ApiProperty } from '@nestjs/swagger';
import { LessonFormat, VerificationStatus } from '@prisma/client';

/**
 * Response shapes for the search endpoints. These mirror the view interfaces in
 * `search.types.ts` (and the projection built in `search.mapper.ts`) so Swagger
 * can advertise the response schema — the TypeScript interfaces are erased at
 * compile time and are invisible to the OpenAPI generator.
 */

/** A subject shown on a search result card. */
export class TutorSearchSubjectDto {
  @ApiProperty({ description: 'Subject id.' })
  subjectId!: string;

  @ApiProperty({ description: 'Localized subject name.' })
  name!: string;

  @ApiProperty({ description: 'URL-safe subject slug.' })
  slug!: string;
}

/** A service district shown on a search result card. */
export class TutorSearchDistrictDto {
  @ApiProperty({ description: 'District id.' })
  districtId!: string;

  @ApiProperty({ description: 'Localized district name.' })
  name!: string;

  @ApiProperty({ description: 'URL-safe district slug.' })
  slug!: string;
}

/** A language shown on a search result card. */
export class TutorSearchLanguageDto {
  @ApiProperty({ description: 'Language id.' })
  languageId!: string;

  @ApiProperty({ description: 'Localized language name.' })
  name!: string;

  @ApiProperty({ description: 'ISO language code.', example: 'az' })
  code!: string;
}

/**
 * Slim discovery card returned by tutor search. Intentionally leaner than the
 * public profile detail (no certificates, no internal counters).
 */
export class TutorSearchItemDto {
  @ApiProperty({ description: 'Tutor profile id.' })
  id!: string;

  @ApiProperty({ type: String, nullable: true, description: 'Display name, if set.' })
  name!: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Avatar URL, if set.' })
  avatarUrl!: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Free-text bio, if set.' })
  bio!: string | null;

  @ApiProperty({ description: 'Years of teaching experience.' })
  experienceYears!: number;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'The tutor’s HOURLY base rate, or null if not set.',
  })
  hourlyRate!: number | null;

  @ApiProperty({ description: 'ISO currency code.', example: 'AZN' })
  currency!: string;

  @ApiProperty({ enum: LessonFormat, enumName: 'LessonFormat', isArray: true })
  formats!: LessonFormat[];

  @ApiProperty({ enum: VerificationStatus, enumName: 'VerificationStatus' })
  verificationStatus!: VerificationStatus;

  @ApiProperty({ description: 'Average rating (0 when unrated).' })
  ratingAvg!: number;

  @ApiProperty({ description: 'Number of ratings received.' })
  ratingCount!: number;

  @ApiProperty({ type: [TutorSearchSubjectDto] })
  subjects!: TutorSearchSubjectDto[];

  @ApiProperty({ type: [TutorSearchDistrictDto] })
  districts!: TutorSearchDistrictDto[];

  @ApiProperty({ type: [TutorSearchLanguageDto] })
  languages!: TutorSearchLanguageDto[];
}
