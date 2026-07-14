/**
 * subscription API — read plans + the caller's billing standing, subscribe, cancel,
 * and page the payment history (tutor epic #51, #58; backend billing #36).
 *
 * Every authenticated call goes through the shared client, so auth + transparent
 * refresh are handled in one place. `subscribe`/`cancel` return the affected
 * subscription; the summary and history are re-read via query invalidation rather
 * than patched from these partial payloads.
 */
import { apiClient } from '@/shared/lib';
import type { Paginated } from '@/shared';

import { PAYMENTS_PAGE_SIZE, SUBSCRIPTION_ENDPOINTS } from '../constants';
import type {
  EntitlementSummary,
  Payment,
  Subscription,
  SubscribeInput,
  SubscriptionPlan,
} from '../types';

/** GET the public catalogue of active plans. */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data } = await apiClient.get<SubscriptionPlan[]>(SUBSCRIPTION_ENDPOINTS.plans);
  return data;
}

/** GET the caller's current subscription and resolved entitlements. */
export async function getSubscriptionSummary(): Promise<EntitlementSummary> {
  const { data } = await apiClient.get<EntitlementSummary>(SUBSCRIPTION_ENDPOINTS.summary);
  return data;
}

/** POST to subscribe to a plan by tier and return the created subscription. */
export async function subscribeToPlan(input: SubscribeInput): Promise<Subscription> {
  const { data } = await apiClient.post<Subscription>(SUBSCRIPTION_ENDPOINTS.subscribe, input);
  return data;
}

/** POST to cancel the caller's subscription at period end and return it. */
export async function cancelSubscription(): Promise<Subscription> {
  const { data } = await apiClient.post<Subscription>(SUBSCRIPTION_ENDPOINTS.cancel);
  return data;
}

/** GET one page of the caller's payment history, newest first. */
export async function getPayments(
  page = 1,
  limit = PAYMENTS_PAGE_SIZE,
): Promise<Paginated<Payment>> {
  const { data } = await apiClient.get<Paginated<Payment>>(SUBSCRIPTION_ENDPOINTS.payments, {
    params: { page, limit },
  });
  return data;
}
