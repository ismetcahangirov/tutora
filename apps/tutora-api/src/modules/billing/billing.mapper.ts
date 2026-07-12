import { type Payment, type Plan, Prisma } from '@prisma/client';
import { resolveEntitlements } from './plan-entitlements';
import type {
  AdminPaymentView,
  AdminSubscriptionView,
  PaymentView,
  PlanView,
  SubscriptionView,
} from './billing.types';

/** Prisma `Decimal` money columns cross the wire as JS numbers. */
function num(value: Prisma.Decimal): number {
  return Number(value);
}

// ── Plans ────────────────────────────────────────────────────────────────────

export function toPlanView(p: Plan): PlanView {
  return {
    id: p.id,
    tier: p.tier,
    name: p.name,
    priceMonthly: num(p.priceMonthly),
    currency: p.currency,
    entitlements: resolveEntitlements(p.tier, p.entitlements),
    isActive: p.isActive,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// ── Subscriptions ──────────────────────────────────────────────────────────────

/** Relations loaded to project a subscription: its plan's tier, name and overrides. */
export const SUBSCRIPTION_INCLUDE = {
  plan: { select: { tier: true, name: true, entitlements: true } },
} satisfies Prisma.SubscriptionInclude;

export type SubscriptionWithPlan = Prisma.SubscriptionGetPayload<{
  include: typeof SUBSCRIPTION_INCLUDE;
}>;

/** Admin subscription view also needs the subscriber's identity. */
export const ADMIN_SUBSCRIPTION_INCLUDE = {
  plan: { select: { tier: true, name: true, entitlements: true } },
  user: { select: { name: true, email: true } },
} satisfies Prisma.SubscriptionInclude;

export type AdminSubscriptionRow = Prisma.SubscriptionGetPayload<{
  include: typeof ADMIN_SUBSCRIPTION_INCLUDE;
}>;

export function toSubscriptionView(s: SubscriptionWithPlan): SubscriptionView {
  return {
    id: s.id,
    tier: s.plan.tier,
    planName: s.plan.name,
    status: s.status,
    currentPeriodStart: s.currentPeriodStart,
    currentPeriodEnd: s.currentPeriodEnd,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

export function toAdminSubscriptionView(s: AdminSubscriptionRow): AdminSubscriptionView {
  return {
    ...toSubscriptionView(s),
    userId: s.userId,
    userName: s.user.name,
    userEmail: s.user.email,
  };
}

// ── Payments ─────────────────────────────────────────────────────────────────

/** Admin payment view also needs the paying user's identity. */
export const ADMIN_PAYMENT_INCLUDE = {
  user: { select: { name: true, email: true } },
} satisfies Prisma.PaymentInclude;

export type AdminPaymentRow = Prisma.PaymentGetPayload<{ include: typeof ADMIN_PAYMENT_INCLUDE }>;

export function toPaymentView(p: Payment): PaymentView {
  return {
    id: p.id,
    amount: num(p.amount),
    currency: p.currency,
    status: p.status,
    provider: p.provider,
    providerRef: p.providerRef,
    subscriptionId: p.subscriptionId,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export function toAdminPaymentView(p: AdminPaymentRow): AdminPaymentView {
  return {
    ...toPaymentView(p),
    userId: p.userId,
    userName: p.user.name,
    userEmail: p.user.email,
  };
}
