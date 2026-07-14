/**
 * Payments & subscription-plans API (issue #68). Uses the shared Axios client;
 * every response is validated at the boundary with Zod. Backed by the API's
 * `admin/plans` (catalogue) and `admin/billing` (subscriptions + payments)
 * controllers.
 */
import { apiClient, paginatedSchema, type Paginated } from '@shared/lib';

import {
  ADMIN_PAYMENTS_ENDPOINT,
  ADMIN_PLANS_ENDPOINT,
  ADMIN_SUBSCRIPTIONS_ENDPOINT,
} from '../constants';
import {
  adminPaymentSchema,
  adminSubscriptionSchema,
  planSchema,
  type AdminPayment,
  type AdminSubscription,
  type CreatePlanBody,
  type ListPaymentsParams,
  type ListSubscriptionsParams,
  type Plan,
  type UpdatePaymentStatusBody,
  type UpdatePlanBody,
} from '../types';

const plansSchema = planSchema.array();
const subscriptionsPageSchema = paginatedSchema(adminSubscriptionSchema);
const paymentsPageSchema = paginatedSchema(adminPaymentSchema);

/** List every plan, including retired ones. */
export async function listPlans(): Promise<Plan[]> {
  const { data } = await apiClient.get<unknown>(ADMIN_PLANS_ENDPOINT);
  return plansSchema.parse(data);
}

/** Create a plan for a tier that has none yet. */
export async function createPlan(body: CreatePlanBody): Promise<Plan> {
  const { data } = await apiClient.post<unknown>(ADMIN_PLANS_ENDPOINT, body);
  return planSchema.parse(data);
}

/** Update a plan's price, entitlements, or availability. */
export async function updatePlan(id: string, body: UpdatePlanBody): Promise<Plan> {
  const { data } = await apiClient.patch<unknown>(`${ADMIN_PLANS_ENDPOINT}/${id}`, body);
  return planSchema.parse(data);
}

/** List subscriptions (paginated, filterable by status and user). */
export async function listSubscriptions(
  params: ListSubscriptionsParams,
): Promise<Paginated<AdminSubscription>> {
  const { data } = await apiClient.get<unknown>(ADMIN_SUBSCRIPTIONS_ENDPOINT, {
    params: {
      page: params.page,
      limit: params.limit,
      status: params.status,
      userId: params.userId || undefined,
    },
  });
  return subscriptionsPageSchema.parse(data);
}

/** List payments / transactions (paginated, filterable by status and user). */
export async function listPayments(params: ListPaymentsParams): Promise<Paginated<AdminPayment>> {
  const { data } = await apiClient.get<unknown>(ADMIN_PAYMENTS_ENDPOINT, {
    params: {
      page: params.page,
      limit: params.limit,
      status: params.status,
      userId: params.userId || undefined,
    },
  });
  return paymentsPageSchema.parse(data);
}

/** Settle or refund a payment. Only legal lifecycle transitions are accepted. */
export async function updatePaymentStatus(
  id: string,
  body: UpdatePaymentStatusBody,
): Promise<AdminPayment> {
  const { data } = await apiClient.patch<unknown>(`${ADMIN_PAYMENTS_ENDPOINT}/${id}/status`, body);
  return adminPaymentSchema.parse(data);
}
