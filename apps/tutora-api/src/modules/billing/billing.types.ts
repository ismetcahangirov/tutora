import type { PaymentStatus, PlanTier, SubscriptionStatus } from '@prisma/client';
import type { Entitlements } from './plan-entitlements';

/** A subscription plan in the catalogue, with entitlements resolved. */
export interface PlanView {
  id: string;
  tier: PlanTier;
  name: string;
  priceMonthly: number;
  currency: string;
  entitlements: Entitlements;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** A user's subscription to a plan. */
export interface SubscriptionView {
  id: string;
  tier: PlanTier;
  planName: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * The caller's effective billing standing: their resolved entitlements plus the
 * paid subscription backing them (`null` when they are on the implicit FREE
 * tier). This is the reusable shape other modules read to enforce limits.
 */
export interface EntitlementSummary {
  tier: PlanTier;
  entitlements: Entitlements;
  subscription: SubscriptionView | null;
}

/** A payment / transaction as shown to its owner. */
export interface PaymentView {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string | null;
  providerRef: string | null;
  subscriptionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Admin projection of a payment — adds the paying user. */
export interface AdminPaymentView extends PaymentView {
  userId: string;
  userName: string | null;
  userEmail: string;
}

/** Admin projection of a subscription — adds the subscriber. */
export interface AdminSubscriptionView extends SubscriptionView {
  userId: string;
  userName: string | null;
  userEmail: string;
}
