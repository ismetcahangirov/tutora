/**
 * Subscription feature — endpoints, query keys, and defaults (tutor epic #51, #58;
 * backend billing #36).
 *
 * User-facing copy lives in the i18n catalogs under `tutor.subscription.*`; this
 * file holds only stable, non-localized constants. The plan catalogue is public
 * (`/plans`); the caller's own standing and actions live under `/billing`.
 */

/** Billing + plan endpoints, appended to `EXPO_PUBLIC_API_URL`. */
export const SUBSCRIPTION_ENDPOINTS = {
  /** Public catalogue of active plans. */
  plans: '/api/v1/plans',
  /** The caller's current subscription + resolved entitlements. */
  summary: '/api/v1/billing/subscription',
  /** Subscribe to a plan by tier. */
  subscribe: '/api/v1/billing/subscribe',
  /** Cancel the caller's subscription at period end. */
  cancel: '/api/v1/billing/cancel',
  /** The caller's payment history (paginated). */
  payments: '/api/v1/billing/payments',
} as const;

/** Default page size for the payment-history list. Matches the backend default. */
export const PAYMENTS_PAGE_SIZE = 20;

/**
 * Structured, stable query keys. `plans` and `summary` are single per-user
 * resources; `payments` is keyed by page size. A write (subscribe/cancel) changes
 * the summary and history, so those mutations invalidate the whole `all` prefix.
 */
export const subscriptionKeys = {
  all: ['subscription'] as const,
  plans: () => [...subscriptionKeys.all, 'plans'] as const,
  summary: () => [...subscriptionKeys.all, 'summary'] as const,
  payments: (limit: number) => [...subscriptionKeys.all, 'payments', { limit }] as const,
};
