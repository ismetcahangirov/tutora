/**
 * Payments & subscription-plans contracts (issue #68). Mirrors the API's billing
 * views (`PlanView`, `AdminSubscriptionView`, `AdminPaymentView`) and the admin
 * write DTOs. Zod validates every backend payload at the boundary; the
 * TypeScript types are inferred from the schemas. Dates arrive as ISO strings
 * over JSON, so date-bearing fields are typed as strings.
 */
import { z } from 'zod';

/** Subscription-plan tiers (mirrors Prisma `PlanTier`). */
export const PLAN_TIERS = ['FREE', 'PRO'] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

/** Subscription lifecycle (mirrors Prisma `SubscriptionStatus`). */
export const SUBSCRIPTION_STATUSES = ['ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** Payment lifecycle (mirrors Prisma `PaymentStatus`). */
export const PAYMENT_STATUSES = ['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Bounds mirrored from the API's DTOs so the form fails fast at the boundary. */
export const PLAN_NAME_MAX_LENGTH = 60;
export const MAX_PLAN_PRICE = 100_000;
export const MAX_ENTITLEMENT_LIMIT = 100_000;
export const PROVIDER_REF_MAX_LENGTH = 200;

/** The capabilities a plan grants (mirrors the API's `Entitlements`). */
export const entitlementsSchema = z.object({
  maxActiveApplications: z.number(),
  maxFavorites: z.number(),
  featuredProfile: z.boolean(),
  analytics: z.boolean(),
  prioritySupport: z.boolean(),
});
export type Entitlements = z.infer<typeof entitlementsSchema>;

/** A subscription plan in the catalogue, with entitlements resolved. */
export const planSchema = z.object({
  id: z.string(),
  tier: z.enum(PLAN_TIERS),
  name: z.string(),
  priceMonthly: z.number(),
  currency: z.string(),
  entitlements: entitlementsSchema,
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Plan = z.infer<typeof planSchema>;

/** Admin projection of a subscription — adds the subscriber. */
export const adminSubscriptionSchema = z.object({
  id: z.string(),
  tier: z.enum(PLAN_TIERS),
  planName: z.string(),
  status: z.enum(SUBSCRIPTION_STATUSES),
  currentPeriodStart: z.string().nullable(),
  currentPeriodEnd: z.string().nullable(),
  userId: z.string(),
  userName: z.string().nullable(),
  userEmail: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AdminSubscription = z.infer<typeof adminSubscriptionSchema>;

/** Admin projection of a payment — adds the paying user. */
export const adminPaymentSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(PAYMENT_STATUSES),
  provider: z.string().nullable(),
  providerRef: z.string().nullable(),
  subscriptionId: z.string().nullable(),
  userId: z.string(),
  userName: z.string().nullable(),
  userEmail: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AdminPayment = z.infer<typeof adminPaymentSchema>;

/** Query parameters for the paginated subscriptions list. */
export type ListSubscriptionsParams = {
  page: number;
  limit: number;
  status?: SubscriptionStatus;
  userId?: string;
};

/** Query parameters for the paginated payments list. */
export type ListPaymentsParams = {
  page: number;
  limit: number;
  status?: PaymentStatus;
  userId?: string;
};

/**
 * Optional entitlement overrides persisted on a plan. Every field is optional;
 * any omitted field falls back to the tier baseline at read time on the API.
 */
export type EntitlementsOverride = Partial<{
  maxActiveApplications: number;
  maxFavorites: number;
  featuredProfile: boolean;
  analytics: boolean;
  prioritySupport: boolean;
}>;

/** Body of `POST /admin/plans`. `tier` is the plan's identity and is required. */
export type CreatePlanBody = {
  tier: PlanTier;
  name: string;
  priceMonthly: number;
  currency?: string;
  entitlements?: EntitlementsOverride;
  isActive?: boolean;
};

/** Body of `PATCH /admin/plans/:id`. Every field optional; `tier` is immutable. */
export type UpdatePlanBody = {
  name?: string;
  priceMonthly?: number;
  currency?: string;
  entitlements?: EntitlementsOverride;
  isActive?: boolean;
};

/** Body of `PATCH /admin/payments/:id/status`. */
export type UpdatePaymentStatusBody = {
  status: PaymentStatus;
  providerRef?: string;
};

// --- Client-side form validation (mirrors the API DTO constraints) ----------

/** Plan display name: non-empty, trimmed, within the API's length cap. */
export const planNameSchema = z.string().trim().min(1).max(PLAN_NAME_MAX_LENGTH);

/** Monthly price: a non-negative amount with at most two decimals. */
export const priceSchema = z
  .number()
  .min(0)
  .max(MAX_PLAN_PRICE)
  // "At most two decimals": the amount in minor units must be a whole number.
  // An epsilon guards against float error (e.g. 9.99 * 100 = 998.999…).
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-9, {
    message: 'At most two decimal places',
  });

/** ISO-4217 currency code (exactly three letters), normalised to upper case. */
export const currencySchema = z
  .string()
  .trim()
  .length(3)
  .transform((value) => value.toUpperCase());

/** An entitlement limit: a non-negative integer within the sanity cap. */
export const entitlementLimitSchema = z.number().int().min(0).max(MAX_ENTITLEMENT_LIMIT);
