import { ApiProperty } from '@nestjs/swagger';
import {
  CertificateStatus,
  LessonFormat,
  PricingPeriod,
  VerificationStatus,
  Weekday,
} from '@prisma/client';

/**
 * Response shapes for the tutors endpoints. These mirror the view interfaces in
 * `tutors.types.ts` (and the projections built in `tutors.mapper.ts`) so Swagger
 * can advertise the response schema — the TypeScript interfaces are erased at
 * compile time and are invisible to the OpenAPI generator.
 */

/** A recurring weekly availability window (minutes from local midnight). */
export class AvailabilitySlotViewDto {
  @ApiProperty({ description: 'Availability slot id.' })
  id!: string;

  @ApiProperty({ enum: Weekday, enumName: 'Weekday' })
  weekday!: Weekday;

  @ApiProperty({ description: 'Window start, minutes from local midnight.', example: 540 })
  startMinute!: number;

  @ApiProperty({ description: 'Window end, minutes from local midnight.', example: 600 })
  endMinute!: number;
}

/** One (period → amount) price point, e.g. an hourly or a monthly rate. */
export class PricingTierViewDto {
  @ApiProperty({ enum: PricingPeriod, enumName: 'PricingPeriod' })
  period!: PricingPeriod;

  @ApiProperty({ description: 'Amount for this billing period.' })
  amount!: number;
}

/** A subject the tutor teaches, with optional per-subject price-override tiers. */
export class TutorSubjectViewDto {
  @ApiProperty({ description: 'Subject id.' })
  subjectId!: string;

  @ApiProperty({ description: 'Localized subject name.' })
  name!: string;

  @ApiProperty({ description: 'URL-safe subject slug.' })
  slug!: string;

  @ApiProperty({
    type: [PricingTierViewDto],
    description: 'Price-override tiers for this subject; empty means "use the base rate".',
  })
  pricingTiers!: PricingTierViewDto[];
}

/** A service district the tutor covers. */
export class TutorDistrictViewDto {
  @ApiProperty({ description: 'District id.' })
  districtId!: string;

  @ApiProperty({ description: 'Localized district name.' })
  name!: string;

  @ApiProperty({ description: 'URL-safe district slug.' })
  slug!: string;
}

/** A language the tutor speaks. */
export class TutorLanguageViewDto {
  @ApiProperty({ description: 'Language id.' })
  languageId!: string;

  @ApiProperty({ description: 'Localized language name.' })
  name!: string;

  @ApiProperty({ description: 'ISO language code.', example: 'az' })
  code!: string;
}

/** A tutor-submitted certificate and its review state. */
export class CertificateViewDto {
  @ApiProperty({ description: 'Certificate id.' })
  id!: string;

  @ApiProperty({ description: 'Certificate title.' })
  title!: string;

  @ApiProperty({ description: 'URL of the uploaded certificate file.' })
  fileUrl!: string;

  @ApiProperty({ enum: CertificateStatus, enumName: 'CertificateStatus' })
  status!: CertificateStatus;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Why the certificate was rejected; null once approved or still pending.',
  })
  reviewReason!: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Issuing organization, if provided.' })
  issuedBy!: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'When the certificate was reviewed, if it has been.',
  })
  reviewedAt!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;
}

/** Full own-profile projection returned to the owning tutor and to admins. */
export class TutorProfileViewDto {
  @ApiProperty({ description: 'Tutor profile id.' })
  id!: string;

  @ApiProperty({ description: 'Owning user id.' })
  userId!: string;

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
    description: 'The HOURLY base tier’s amount, or null if not set.',
  })
  hourlyRate!: number | null;

  @ApiProperty({ type: [PricingTierViewDto], description: 'The base rate, one entry per period.' })
  pricingTiers!: PricingTierViewDto[];

  @ApiProperty({ description: 'ISO currency code.', example: 'AZN' })
  currency!: string;

  @ApiProperty({ enum: LessonFormat, enumName: 'LessonFormat', isArray: true })
  formats!: LessonFormat[];

  @ApiProperty({ enum: VerificationStatus, enumName: 'VerificationStatus' })
  verificationStatus!: VerificationStatus;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Why verification was rejected; null once verified. Shown to the tutor.',
  })
  verificationReason!: string | null;

  @ApiProperty({ description: 'Average rating (0 when unrated).' })
  ratingAvg!: number;

  @ApiProperty({ description: 'Number of ratings received.' })
  ratingCount!: number;

  @ApiProperty({ description: 'Number of times the profile has been viewed.' })
  profileViews!: number;

  @ApiProperty({ description: 'Whether the profile is published (publicly discoverable).' })
  isPublished!: boolean;

  @ApiProperty({ type: [TutorSubjectViewDto] })
  subjects!: TutorSubjectViewDto[];

  @ApiProperty({ type: [TutorDistrictViewDto] })
  districts!: TutorDistrictViewDto[];

  @ApiProperty({ type: [TutorLanguageViewDto] })
  languages!: TutorLanguageViewDto[];

  @ApiProperty({ type: [CertificateViewDto] })
  certificates!: CertificateViewDto[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

/**
 * Public detail projection. Excludes internal counters (profileViews, timestamps)
 * and shows only admin-verified certificates.
 */
export class PublicTutorViewDto {
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
    description: 'The HOURLY base tier’s amount, or null if not set.',
  })
  hourlyRate!: number | null;

  @ApiProperty({ type: [PricingTierViewDto], description: 'The base rate, one entry per period.' })
  pricingTiers!: PricingTierViewDto[];

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

  @ApiProperty({ type: [TutorSubjectViewDto] })
  subjects!: TutorSubjectViewDto[];

  @ApiProperty({ type: [TutorDistrictViewDto] })
  districts!: TutorDistrictViewDto[];

  @ApiProperty({ type: [TutorLanguageViewDto] })
  languages!: TutorLanguageViewDto[];

  @ApiProperty({ type: [CertificateViewDto], description: 'Only admin-verified certificates.' })
  certificates!: CertificateViewDto[];
}

/** Admin full view: the owner projection plus account-level fields. */
export class AdminTutorViewDto extends TutorProfileViewDto {
  @ApiProperty({ description: 'Owning user email.' })
  email!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'When the profile was soft-deleted, if it has been.',
  })
  deletedAt!: string | null;
}

/** Slim row used in admin list responses (relations omitted for payload size). */
export class AdminTutorListItemDto {
  @ApiProperty({ description: 'Tutor profile id.' })
  id!: string;

  @ApiProperty({ description: 'Owning user id.' })
  userId!: string;

  @ApiProperty({ type: String, nullable: true, description: 'Display name, if set.' })
  name!: string | null;

  @ApiProperty({ description: 'Owning user email.' })
  email!: string;

  @ApiProperty({ type: String, nullable: true, description: 'Avatar URL, if set.' })
  avatarUrl!: string | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'The HOURLY base tier’s amount, or null if not set.',
  })
  hourlyRate!: number | null;

  @ApiProperty({ description: 'ISO currency code.', example: 'AZN' })
  currency!: string;

  @ApiProperty({ enum: VerificationStatus, enumName: 'VerificationStatus' })
  verificationStatus!: VerificationStatus;

  @ApiProperty({ description: 'Whether the profile is published.' })
  isPublished!: boolean;

  @ApiProperty({ description: 'Average rating (0 when unrated).' })
  ratingAvg!: number;

  @ApiProperty({ description: 'Number of ratings received.' })
  ratingCount!: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'When the profile was soft-deleted, if it has been.',
  })
  deletedAt!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;
}
