import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus, PlanTier, SubscriptionStatus } from '@prisma/client';

/**
 * Response shapes for the billing endpoints. These mirror the projections built
 * in `billing.mapper.ts` (`PlanView`, `SubscriptionView`, `PaymentView` &
 * friends) and their backing interfaces in `billing.types.ts` — they exist so
 * Swagger can advertise the response schema, since the TypeScript interfaces are
 * erased at compile time and are invisible to the OpenAPI generator.
 */

/** The resolved capabilities a plan grants (mirrors `Entitlements`). */
export class EntitlementsDto {
  @ApiProperty({ description: 'Max concurrent open applications a student may hold.' })
  maxActiveApplications!: number;

  @ApiProperty({ description: 'Max favourite tutors a student may save.' })
  maxFavorites!: number;

  @ApiProperty({ description: 'Whether the tutor profile is eligible for featured placement.' })
  featuredProfile!: boolean;

  @ApiProperty({ description: 'Access to the analytics dashboard.' })
  analytics!: boolean;

  @ApiProperty({ description: 'Priority support queue.' })
  prioritySupport!: boolean;
}

/** A subscription plan in the catalogue, with entitlements resolved. */
export class PlanViewDto {
  @ApiProperty({ description: 'Plan id.' })
  id!: string;

  @ApiProperty({ enum: PlanTier, enumName: 'PlanTier' })
  tier!: PlanTier;

  @ApiProperty({ description: 'Display name of the plan.' })
  name!: string;

  @ApiProperty({ description: 'Monthly price in the plan currency.' })
  priceMonthly!: number;

  @ApiProperty({ description: 'ISO 4217 currency code.', example: 'AZN' })
  currency!: string;

  @ApiProperty({ type: EntitlementsDto })
  entitlements!: EntitlementsDto;

  @ApiProperty({ description: 'Whether the plan is currently offered.' })
  isActive!: boolean;

  @ApiProperty({ format: 'date-time', type: String })
  createdAt!: string;

  @ApiProperty({ format: 'date-time', type: String })
  updatedAt!: string;
}

/** A user's subscription to a plan. */
export class SubscriptionViewDto {
  @ApiProperty({ description: 'Subscription id.' })
  id!: string;

  @ApiProperty({ enum: PlanTier, enumName: 'PlanTier' })
  tier!: PlanTier;

  @ApiProperty({ description: 'Display name of the subscribed plan.' })
  planName!: string;

  @ApiProperty({ enum: SubscriptionStatus, enumName: 'SubscriptionStatus' })
  status!: SubscriptionStatus;

  @ApiProperty({
    format: 'date-time',
    nullable: true,
    type: String,
    description: 'Start of the current billing period, if any.',
  })
  currentPeriodStart!: string | null;

  @ApiProperty({
    format: 'date-time',
    nullable: true,
    type: String,
    description: 'End of the current billing period, if any.',
  })
  currentPeriodEnd!: string | null;

  @ApiProperty({ format: 'date-time', type: String })
  createdAt!: string;

  @ApiProperty({ format: 'date-time', type: String })
  updatedAt!: string;
}

/**
 * The caller's effective billing standing: resolved entitlements plus the paid
 * subscription backing them (`null` on the implicit FREE tier).
 */
export class EntitlementSummaryDto {
  @ApiProperty({ enum: PlanTier, enumName: 'PlanTier' })
  tier!: PlanTier;

  @ApiProperty({ type: EntitlementsDto })
  entitlements!: EntitlementsDto;

  @ApiProperty({ type: SubscriptionViewDto, nullable: true })
  subscription!: SubscriptionViewDto | null;
}

/** A payment / transaction as shown to its owner. */
export class PaymentViewDto {
  @ApiProperty({ description: 'Payment id.' })
  id!: string;

  @ApiProperty({ description: 'Charged amount.' })
  amount!: number;

  @ApiProperty({ description: 'ISO 4217 currency code.', example: 'AZN' })
  currency!: string;

  @ApiProperty({ enum: PaymentStatus, enumName: 'PaymentStatus' })
  status!: PaymentStatus;

  @ApiProperty({ nullable: true, type: String, description: 'Payment provider, if any.' })
  provider!: string | null;

  @ApiProperty({ nullable: true, type: String, description: 'Provider-side reference, if any.' })
  providerRef!: string | null;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'The subscription this payment is for, if any.',
  })
  subscriptionId!: string | null;

  @ApiProperty({ format: 'date-time', type: String })
  createdAt!: string;

  @ApiProperty({ format: 'date-time', type: String })
  updatedAt!: string;
}

/** Admin projection of a subscription — adds the subscriber's identity. */
export class AdminSubscriptionViewDto extends SubscriptionViewDto {
  @ApiProperty({ description: 'Subscriber user id.' })
  userId!: string;

  @ApiProperty({ nullable: true, type: String, description: 'Subscriber display name, if set.' })
  userName!: string | null;

  @ApiProperty({ description: 'Subscriber email.' })
  userEmail!: string;
}

/** Admin projection of a payment — adds the paying user's identity. */
export class AdminPaymentViewDto extends PaymentViewDto {
  @ApiProperty({ description: 'Paying user id.' })
  userId!: string;

  @ApiProperty({ nullable: true, type: String, description: 'Paying user display name, if set.' })
  userName!: string | null;

  @ApiProperty({ description: 'Paying user email.' })
  userEmail!: string;
}
