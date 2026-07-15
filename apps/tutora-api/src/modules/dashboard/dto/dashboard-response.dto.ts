import { ApiProperty } from '@nestjs/swagger';
import { VerificationStatus } from '@prisma/client';

/**
 * Response shapes for the admin dashboard endpoint. These mirror the aggregation
 * interfaces in `dashboard.types.ts` (`DashboardStats` & friends) and exist so
 * Swagger can advertise the response schema — the TypeScript interfaces are
 * erased at compile time and are invisible to the OpenAPI generator.
 */

/** Headline KPIs for the admin dashboard. */
export class DashboardKpisDto {
  @ApiProperty({ description: 'Active (non-deleted) student accounts.', example: 1240 })
  students!: number;

  @ApiProperty({ description: 'Active (non-deleted) tutor accounts.', example: 312 })
  tutors!: number;

  @ApiProperty({ description: 'Tutors awaiting verification review.', example: 8 })
  pendingVerifications!: number;

  @ApiProperty({ description: 'Currently active paid subscriptions.', example: 47 })
  activeSubscriptions!: number;

  @ApiProperty({ description: 'Visible reviews (excludes hidden/removed).', example: 903 })
  publishedReviews!: number;

  @ApiProperty({
    description: 'Revenue from succeeded payments in the current calendar month.',
    example: 158000,
  })
  monthlyRevenue!: number;

  @ApiProperty({ description: 'Currency the revenue figure is reported in.', example: 'AZN' })
  revenueCurrency!: string;
}

/** Tutor headcount for one verification state (drives the breakdown chart). */
export class TutorStatusCountDto {
  @ApiProperty({ enum: VerificationStatus, enumName: 'VerificationStatus' })
  status!: VerificationStatus;

  @ApiProperty({ description: 'Number of tutors in this verification state.', example: 42 })
  count!: number;
}

/** One day of the signups trend (drives the trend chart). */
export class SignupsPointDto {
  @ApiProperty({ description: 'UTC day, `YYYY-MM-DD`.', example: '2026-07-14' })
  date!: string;

  @ApiProperty({ description: 'New students created that day.', example: 12 })
  students!: number;

  @ApiProperty({ description: 'New tutors created that day.', example: 4 })
  tutors!: number;
}

/** Full payload of `GET /api/v1/admin/dashboard`. */
export class DashboardStatsDto {
  @ApiProperty({ type: DashboardKpisDto })
  kpis!: DashboardKpisDto;

  @ApiProperty({
    type: [TutorStatusCountDto],
    description: 'Tutor headcount per verification state.',
  })
  tutorsByStatus!: TutorStatusCountDto[];

  @ApiProperty({
    type: [SignupsPointDto],
    description: 'Daily signups over the trailing window.',
  })
  signups!: SignupsPointDto[];
}
