import { describe, expect, it } from 'vitest';

import { nextPaymentStatuses } from './constants';
import {
  adminPaymentSchema,
  adminSubscriptionSchema,
  currencySchema,
  planNameSchema,
  planSchema,
  priceSchema,
} from './types';

const rawPlan = {
  id: 'p1',
  tier: 'PRO',
  name: 'Pro',
  priceMonthly: 9.99,
  currency: 'AZN',
  entitlements: {
    maxActiveApplications: 50,
    maxFavorites: 500,
    featuredProfile: true,
    analytics: true,
    prioritySupport: true,
  },
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const rawSubscription = {
  id: 'sub1',
  tier: 'PRO',
  planName: 'Pro',
  status: 'ACTIVE',
  currentPeriodStart: '2026-01-01T00:00:00.000Z',
  currentPeriodEnd: '2026-02-01T00:00:00.000Z',
  userId: 'u1',
  userName: 'Alice',
  userEmail: 'alice@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const rawPayment = {
  id: 'pay1',
  amount: 9.99,
  currency: 'AZN',
  status: 'SUCCEEDED',
  provider: 'stripe',
  providerRef: 'pi_123',
  subscriptionId: 'sub1',
  userId: 'u1',
  userName: 'Alice',
  userEmail: 'alice@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

describe('planSchema', () => {
  it('parses a valid plan with resolved entitlements', () => {
    const plan = planSchema.parse(rawPlan);
    expect(plan.tier).toBe('PRO');
    expect(plan.entitlements.analytics).toBe(true);
    expect(plan.isActive).toBe(true);
  });

  it('rejects an unknown tier', () => {
    expect(planSchema.safeParse({ ...rawPlan, tier: 'ENTERPRISE' }).success).toBe(false);
  });
});

describe('adminSubscriptionSchema', () => {
  it('parses a subscription and keeps null periods', () => {
    const sub = adminSubscriptionSchema.parse({
      ...rawSubscription,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      userName: null,
    });
    expect(sub.status).toBe('ACTIVE');
    expect(sub.currentPeriodEnd).toBeNull();
    expect(sub.userName).toBeNull();
  });
});

describe('adminPaymentSchema', () => {
  it('parses a payment with its paying user', () => {
    const payment = adminPaymentSchema.parse(rawPayment);
    expect(payment.status).toBe('SUCCEEDED');
    expect(payment.userEmail).toBe('alice@example.com');
  });

  it('accepts null provider metadata', () => {
    const payment = adminPaymentSchema.parse({
      ...rawPayment,
      provider: null,
      providerRef: null,
      subscriptionId: null,
    });
    expect(payment.provider).toBeNull();
  });
});

describe('nextPaymentStatuses', () => {
  it('lets a pending payment settle or fail', () => {
    expect(nextPaymentStatuses('PENDING')).toEqual(['SUCCEEDED', 'FAILED']);
  });

  it('lets a succeeded payment be refunded', () => {
    expect(nextPaymentStatuses('SUCCEEDED')).toEqual(['REFUNDED']);
  });

  it('offers no transition from a terminal state', () => {
    expect(nextPaymentStatuses('FAILED')).toEqual([]);
    expect(nextPaymentStatuses('REFUNDED')).toEqual([]);
  });
});

describe('form validation schemas', () => {
  it('trims and bounds the plan name', () => {
    expect(planNameSchema.parse('  Pro  ')).toBe('Pro');
    expect(planNameSchema.safeParse('').success).toBe(false);
    expect(planNameSchema.safeParse('x'.repeat(61)).success).toBe(false);
  });

  it('rejects negative prices and more than two decimals', () => {
    expect(priceSchema.safeParse(9.99).success).toBe(true);
    expect(priceSchema.safeParse(-1).success).toBe(false);
    expect(priceSchema.safeParse(1.999).success).toBe(false);
  });

  it('normalises a three-letter currency to upper case', () => {
    expect(currencySchema.parse('azn')).toBe('AZN');
    expect(currencySchema.safeParse('AZNN').success).toBe(false);
  });
});
