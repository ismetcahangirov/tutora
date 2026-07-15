import { ApiProperty } from '@nestjs/swagger';
import { EducationLevel, VerificationStatus } from '@prisma/client';

/**
 * Response shapes for the students endpoints. These mirror the interfaces in
 * `students.types.ts` (`StudentProfileView`, `FavoriteTutorView`,
 * `AdminStudentView`, `AdminStudentListItem`) and exist so Swagger can advertise
 * the response schema — the TypeScript interfaces are erased at compile time and
 * are invisible to the OpenAPI generator.
 */

/** The authenticated student's own profile (preferences live here, #30). */
export class StudentProfileViewDto {
  @ApiProperty({ description: 'Student profile id.' })
  id!: string;

  @ApiProperty({ description: 'Owning user id.' })
  userId!: string;

  @ApiProperty({ nullable: true, type: String, description: 'Display name, if set.' })
  name!: string | null;

  @ApiProperty({ nullable: true, type: String, description: 'Avatar URL, if set.' })
  avatarUrl!: string | null;

  @ApiProperty({ nullable: true, type: String, description: 'Free-text bio, if set.' })
  bio!: string | null;

  @ApiProperty({
    enum: EducationLevel,
    enumName: 'EducationLevel',
    nullable: true,
    description: 'Current education level, if set.',
  })
  educationLevel!: EducationLevel | null;

  @ApiProperty({ description: 'Number of tutors the student has favorited.' })
  favoritesCount!: number;

  @ApiProperty({ format: 'date-time', type: String })
  createdAt!: string;

  @ApiProperty({ format: 'date-time', type: String })
  updatedAt!: string;
}

/** A favorited tutor as seen in the student's favorites list. */
export class FavoriteTutorViewDto {
  @ApiProperty({ description: 'Favorited tutor id.' })
  tutorId!: string;

  @ApiProperty({ nullable: true, type: String, description: 'Tutor display name, if set.' })
  name!: string | null;

  @ApiProperty({ nullable: true, type: String, description: 'Tutor avatar URL, if set.' })
  avatarUrl!: string | null;

  @ApiProperty({ description: 'Advertised hourly rate.' })
  hourlyRate!: number;

  @ApiProperty({ description: 'ISO 4217 currency code for the hourly rate.', example: 'AZN' })
  currency!: string;

  @ApiProperty({ description: 'Average review rating.' })
  ratingAvg!: number;

  @ApiProperty({ enum: VerificationStatus, enumName: 'VerificationStatus' })
  verificationStatus!: VerificationStatus;

  @ApiProperty({ description: 'Whether the tutor profile is publicly published.' })
  isPublished!: boolean;

  @ApiProperty({ format: 'date-time', type: String, description: 'When the tutor was favorited.' })
  favoritedAt!: string;
}

/** Admin full view: the student projection plus account-level fields. */
export class AdminStudentViewDto extends StudentProfileViewDto {
  @ApiProperty({ description: 'Account email.' })
  email!: string;

  @ApiProperty({
    format: 'date-time',
    nullable: true,
    type: String,
    description: 'When the profile was soft-deleted, if it has been.',
  })
  deletedAt!: string | null;
}

/** Slim row used in admin list responses. */
export class AdminStudentListItemDto {
  @ApiProperty({ description: 'Student profile id.' })
  id!: string;

  @ApiProperty({ description: 'Owning user id.' })
  userId!: string;

  @ApiProperty({ nullable: true, type: String, description: 'Display name, if set.' })
  name!: string | null;

  @ApiProperty({ description: 'Account email.' })
  email!: string;

  @ApiProperty({ nullable: true, type: String, description: 'Avatar URL, if set.' })
  avatarUrl!: string | null;

  @ApiProperty({
    enum: EducationLevel,
    enumName: 'EducationLevel',
    nullable: true,
    description: 'Current education level, if set.',
  })
  educationLevel!: EducationLevel | null;

  @ApiProperty({ description: 'Number of tutors the student has favorited.' })
  favoritesCount!: number;

  @ApiProperty({
    format: 'date-time',
    nullable: true,
    type: String,
    description: 'When the profile was soft-deleted, if it has been.',
  })
  deletedAt!: string | null;

  @ApiProperty({ format: 'date-time', type: String })
  createdAt!: string;
}
