/**
 * Subscription feature — API contract types (tutor epic #51, #58; backend billing #36).
 *
 * These mirror the backend `billing` views over the wire: `Decimal` money columns
 * arrive as plain numbers and every timestamp as an ISO string. The tutor-facing
 * benefit of a paid plan is `featuredProfile` (premium visibility in search); the
 * numeric limits are student-oriented but kept for completeness.
 */

/** Subscription tiers. `FREE` is the implicit baseline; `PRO` is the paid plan. */
export type PlanTier = 'FREE' | 'PRO';

/** Lifecycle of a subscription. `CANCELED` still grants access until the period end. */
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';

/** Lifecycle of a payment / transaction. */
export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';

/** The capabilities a plan grants. Resolved server-side from the plan's tier + overrides. */
export type Entitlements = {
  maxActiveApplications: number;
  maxFavorites: number;
  /** Tutor: profile is eligible for boosted / featured placement in search. */
  featuredProfile: boolean;
  /** Access to the analytics dashboard. */
  analytics: boolean;
  /** Priority support queue. */
  prioritySupport: boolean;
};

/** A subscription plan in the catalogue — `GET /api/v1/plans`. */
export type SubscriptionPlan = {
  id: string;
  tier: PlanTier;
  name: string;
  priceMonthly: number;
  currency: string;
  entitlements: Entitlements;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/** The caller's subscription to a plan. */
export type Subscription = {
  id: string;
  tier: PlanTier;
  planName: string;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * The caller's effective billing standing — `GET /api/v1/billing/subscription`.
 * `subscription` is `null` on the implicit FREE tier.
 */
export type EntitlementSummary = {
  tier: PlanTier;
  entitlements: Entitlements;
  subscription: Subscription | null;
};

/** A payment / transaction as shown to its owner — `GET /api/v1/billing/payments`. */
export type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string | null;
  providerRef: string | null;
  subscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Body of `POST /api/v1/billing/subscribe` — pick a plan by its (unique) tier. */
export type SubscribeInput = {
  tier: PlanTier;
};
