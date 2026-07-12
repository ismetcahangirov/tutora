import { PaymentStatus, Prisma, SubscriptionStatus } from '@prisma/client';
import {
  toAdminPaymentView,
  toAdminSubscriptionView,
  toPaymentView,
  toPlanView,
  toSubscriptionView,
} from './billing.mapper';

const AT = new Date('2026-07-01T00:00:00Z');

describe('toPlanView', () => {
  it('converts Decimal price to a number and resolves entitlements', () => {
    const view = toPlanView({
      id: 'plan-pro',
      tier: 'PRO',
      name: 'Pro',
      priceMonthly: new Prisma.Decimal('19.99'),
      currency: 'AZN',
      entitlements: { maxFavorites: 999 },
      isActive: true,
      createdAt: AT,
      updatedAt: AT,
    });

    expect(view.priceMonthly).toBe(19.99);
    expect(typeof view.priceMonthly).toBe('number');
    expect(view.entitlements).toMatchObject({ maxFavorites: 999, analytics: true });
  });
});

describe('toSubscriptionView', () => {
  it('projects a subscription with its plan tier and name', () => {
    const view = toSubscriptionView({
      id: 'sub1',
      userId: 'u1',
      planId: 'plan-pro',
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: AT,
      currentPeriodEnd: AT,
      createdAt: AT,
      updatedAt: AT,
      plan: { tier: 'PRO', name: 'Pro', entitlements: null },
    });

    expect(view).toMatchObject({ id: 'sub1', tier: 'PRO', planName: 'Pro', status: 'ACTIVE' });
  });
});

describe('toPaymentView / toAdminPaymentView', () => {
  const row = {
    id: 'pay1',
    userId: 'u1',
    subscriptionId: 'sub1',
    amount: new Prisma.Decimal('19.99'),
    currency: 'AZN',
    status: PaymentStatus.PENDING,
    provider: 'stripe',
    providerRef: 'ch_1',
    createdAt: AT,
    updatedAt: AT,
  };

  it('converts amount to a number', () => {
    expect(toPaymentView(row)).toMatchObject({ id: 'pay1', amount: 19.99, provider: 'stripe' });
  });

  it('adds the paying user for the admin view', () => {
    const view = toAdminPaymentView({ ...row, user: { name: 'Bob', email: 'bob@t.co' } });
    expect(view).toMatchObject({
      amount: 19.99,
      userId: 'u1',
      userName: 'Bob',
      userEmail: 'bob@t.co',
    });
  });
});

describe('toAdminSubscriptionView', () => {
  it('adds the subscriber identity', () => {
    const view = toAdminSubscriptionView({
      id: 'sub1',
      userId: 'u1',
      planId: 'plan-pro',
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: AT,
      currentPeriodEnd: AT,
      createdAt: AT,
      updatedAt: AT,
      plan: { tier: 'PRO', name: 'Pro', entitlements: null },
      user: { name: 'Bob', email: 'bob@t.co' },
    });

    expect(view).toMatchObject({
      tier: 'PRO',
      userId: 'u1',
      userName: 'Bob',
      userEmail: 'bob@t.co',
    });
  });
});
