import { API_PREFIX } from '@shared/lib';

import type {
  Entitlements,
  ListPaymentsParams,
  ListSubscriptionsParams,
  PaymentStatus,
  PlanTier,
} from './types';

/** Admin billing endpoints (relative to `VITE_API_URL`). */
export const ADMIN_PLANS_ENDPOINT = `${API_PREFIX}/admin/plans`;
export const ADMIN_SUBSCRIPTIONS_ENDPOINT = `${API_PREFIX}/admin/subscriptions`;
export const ADMIN_PAYMENTS_ENDPOINT = `${API_PREFIX}/admin/payments`;

/** Page size for the subscriptions and transactions tables. */
export const BILLING_PAGE_SIZE = 20;

/**
 * Query keys. Invalidating a resource's `all` also invalidates every
 * `list(params)` under it, so a mutation refreshes the current page in one call.
 */
export const paymentsKeys = {
  plans: ['admin', 'plans'] as const,
  subscriptions: {
    all: ['admin', 'subscriptions'] as const,
    list: (params: ListSubscriptionsParams) => ['admin', 'subscriptions', 'list', params] as const,
  },
  payments: {
    all: ['admin', 'payments'] as const,
    list: (params: ListPaymentsParams) => ['admin', 'payments', 'list', params] as const,
  },
};

/**
 * Payment lifecycle state machine, mirrored from the API's `PAYMENT_TRANSITIONS`
 * so the UI only ever offers a legal next status. Terminal states have no
 * outgoing edges.
 *
 *   PENDING ──▶ SUCCEEDED ──▶ REFUNDED
 *      └───────▶ FAILED
 */
export const PAYMENT_TRANSITIONS: Readonly<Record<PaymentStatus, readonly PaymentStatus[]>> = {
  PENDING: ['SUCCEEDED', 'FAILED'],
  SUCCEEDED: ['REFUNDED'],
  FAILED: [],
  REFUNDED: [],
};

/** The legal next statuses for a payment; empty when it is already terminal. */
export function nextPaymentStatuses(from: PaymentStatus): readonly PaymentStatus[] {
  return PAYMENT_TRANSITIONS[from];
}

/**
 * Per-tier entitlement baselines, mirrored from the API's `TIER_DEFAULTS`. Used
 * only to seed a new plan's form with sensible starting values — the backend
 * remains the source of truth and resolves the effective entitlements on read.
 */
export const TIER_ENTITLEMENT_DEFAULTS: Readonly<Record<PlanTier, Entitlements>> = {
  FREE: {
    maxActiveApplications: 3,
    maxFavorites: 20,
    featuredProfile: false,
    analytics: false,
    prioritySupport: false,
  },
  PRO: {
    maxActiveApplications: 50,
    maxFavorites: 500,
    featuredProfile: true,
    analytics: true,
    prioritySupport: true,
  },
};
