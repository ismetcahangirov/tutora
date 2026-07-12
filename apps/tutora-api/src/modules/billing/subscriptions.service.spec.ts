import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PaymentStatus, Prisma, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { ListSubscriptionsQueryDto } from './dto/list-subscriptions-query.dto';
import { SubscriptionsService } from './subscriptions.service';

const AT = new Date('2026-07-01T00:00:00Z');

/** The first argument of a jest mock's first call, typed for lint-safe assertions. */
function firstArg<T>(fn: jest.Mock): T {
  const calls = fn.mock.calls as unknown[][];
  return calls[0]?.[0] as T;
}

function planRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'plan-pro',
    tier: 'PRO',
    name: 'Pro',
    priceMonthly: new Prisma.Decimal('19.99'),
    currency: 'AZN',
    entitlements: null,
    isActive: true,
    createdAt: AT,
    updatedAt: AT,
    ...overrides,
  };
}

function subRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub1',
    userId: 'u1',
    planId: 'plan-pro',
    status: SubscriptionStatus.ACTIVE,
    currentPeriodStart: AT,
    currentPeriodEnd: new Date('2026-07-31T00:00:00Z'),
    createdAt: AT,
    updatedAt: AT,
    plan: { tier: 'PRO', name: 'Pro', entitlements: null },
    ...overrides,
  };
}

function buildPrismaMock() {
  const prisma = {
    plan: {
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    subscription: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(subRow()),
      update: jest.fn().mockResolvedValue(subRow()),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    payment: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((arg: unknown) =>
    Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: unknown) => unknown)(prisma),
  );
  return prisma;
}

async function buildService(prisma: ReturnType<typeof buildPrismaMock>) {
  const moduleRef = await Test.createTestingModule({
    providers: [SubscriptionsService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return moduleRef.get(SubscriptionsService);
}

describe('SubscriptionsService.subscribe', () => {
  it('rejects a tier with no active plan', async () => {
    const prisma = buildPrismaMock();
    const service = await buildService(prisma);
    await expect(service.subscribe('u1', { tier: 'PRO' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects re-subscribing to the tier the user already holds', async () => {
    const prisma = buildPrismaMock();
    prisma.plan.findFirst.mockResolvedValueOnce(planRow());
    prisma.subscription.findFirst.mockResolvedValueOnce(subRow());
    const service = await buildService(prisma);

    await expect(service.subscribe('u1', { tier: 'PRO' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.subscription.create).not.toHaveBeenCalled();
  });

  it('supersedes the current subscription and records a PENDING payment for a priced plan', async () => {
    const prisma = buildPrismaMock();
    prisma.plan.findFirst.mockResolvedValueOnce(planRow());
    prisma.subscription.create.mockResolvedValueOnce(subRow());
    const service = await buildService(prisma);

    const result = await service.subscribe('u1', { tier: 'PRO', provider: 'stripe' });

    const supersede = firstArg<{ data: { status: string; currentPeriodEnd: Date } }>(
      prisma.subscription.updateMany,
    );
    expect(supersede.data.status).toBe('EXPIRED');
    expect(supersede.data.currentPeriodEnd).toBeInstanceOf(Date);

    const created = firstArg<{ data: { status: string; planId: string } }>(
      prisma.subscription.create,
    );
    expect(created.data).toMatchObject({ status: 'ACTIVE', planId: 'plan-pro' });

    const payment = firstArg<{ data: { status: string; provider: string } }>(prisma.payment.create);
    expect(payment.data).toMatchObject({ status: PaymentStatus.PENDING, provider: 'stripe' });

    expect(result).toMatchObject({ tier: 'PRO', status: 'ACTIVE' });
  });

  it('records no payment when subscribing to a free plan', async () => {
    const prisma = buildPrismaMock();
    prisma.plan.findFirst.mockResolvedValueOnce(
      planRow({
        id: 'plan-free',
        tier: 'FREE',
        name: 'Free',
        priceMonthly: new Prisma.Decimal('0'),
      }),
    );
    prisma.subscription.create.mockResolvedValueOnce(
      subRow({ plan: { tier: 'FREE', name: 'Free', entitlements: null } }),
    );
    const service = await buildService(prisma);

    await service.subscribe('u1', { tier: 'FREE' });

    expect(prisma.payment.create).not.toHaveBeenCalled();
  });
});

describe('SubscriptionsService.cancel', () => {
  it('cancels an in-force subscription (kept until period end)', async () => {
    const prisma = buildPrismaMock();
    prisma.subscription.findFirst.mockResolvedValueOnce(subRow());
    prisma.subscription.update.mockResolvedValueOnce(
      subRow({ status: SubscriptionStatus.CANCELED }),
    );
    const service = await buildService(prisma);

    const result = await service.cancel('u1');

    expect(prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'sub1' }, data: { status: 'CANCELED' } }),
    );
    expect(result.status).toBe('CANCELED');
  });

  it('404s when there is nothing to cancel', async () => {
    const prisma = buildPrismaMock();
    prisma.subscription.findFirst.mockResolvedValueOnce(null);
    const service = await buildService(prisma);
    await expect(service.cancel('u1')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('SubscriptionsService.getSummary', () => {
  it('resolves entitlements from the effective subscription', async () => {
    const prisma = buildPrismaMock();
    prisma.subscription.findFirst.mockResolvedValueOnce(subRow());
    const service = await buildService(prisma);

    const summary = await service.getSummary('u1');

    expect(summary.tier).toBe('PRO');
    expect(summary.entitlements).toMatchObject({ analytics: true, featuredProfile: true });
    expect(summary.subscription).toMatchObject({ id: 'sub1' });
  });

  it('falls back to FREE when the user has no subscription', async () => {
    const prisma = buildPrismaMock();
    prisma.subscription.findFirst.mockResolvedValueOnce(null);
    prisma.plan.findUnique.mockResolvedValueOnce(
      planRow({
        id: 'plan-free',
        tier: 'FREE',
        name: 'Free',
        priceMonthly: new Prisma.Decimal('0'),
      }),
    );
    const service = await buildService(prisma);

    const summary = await service.getSummary('u1');

    expect(summary).toMatchObject({ tier: 'FREE', subscription: null });
    expect(summary.entitlements).toMatchObject({ analytics: false, maxActiveApplications: 3 });
  });
});

describe('SubscriptionsService.listAll', () => {
  it('applies status and user filters and returns a paginated envelope', async () => {
    const prisma = buildPrismaMock();
    prisma.subscription.findMany.mockResolvedValueOnce([
      subRow({ plan: { tier: 'PRO', name: 'Pro' }, user: { name: 'Bob', email: 'bob@t.co' } }),
    ]);
    prisma.subscription.count.mockResolvedValueOnce(1);
    const service = await buildService(prisma);

    const query = Object.assign(new ListSubscriptionsQueryDto(), {
      status: SubscriptionStatus.ACTIVE,
      userId: 'u1',
    });
    const result = await service.listAll(query);

    expect(prisma.subscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'ACTIVE', userId: 'u1' } }),
    );
    expect(result.meta.total).toBe(1);
    expect(result.data[0]).toMatchObject({ userId: 'u1', userName: 'Bob' });
  });
});
