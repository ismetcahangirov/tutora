import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PaymentStatus, Prisma, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';
import { ListPaymentsQueryDto } from './dto/list-payments-query.dto';
import { PaymentsService } from './payments.service';

const AT = new Date('2026-07-01T00:00:00Z');

function payRow(overrides: Record<string, unknown> = {}) {
  return {
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
    ...overrides,
  };
}

function adminPayRow(overrides: Record<string, unknown> = {}) {
  return { ...payRow(), user: { name: 'Bob', email: 'bob@t.co' }, ...overrides };
}

function buildPrismaMock() {
  const prisma = {
    payment: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn().mockResolvedValue(adminPayRow()),
    },
    subscription: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((arg: unknown) =>
    Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: unknown) => unknown)(prisma),
  );
  return prisma;
}

async function buildService(prisma: ReturnType<typeof buildPrismaMock>) {
  const moduleRef = await Test.createTestingModule({
    providers: [PaymentsService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return moduleRef.get(PaymentsService);
}

describe('PaymentsService.listForUser', () => {
  it('lists only the caller’s payments, newest first', async () => {
    const prisma = buildPrismaMock();
    prisma.payment.findMany.mockResolvedValueOnce([payRow()]);
    prisma.payment.count.mockResolvedValueOnce(1);
    const service = await buildService(prisma);

    const result = await service.listForUser('u1', new PaginationQueryDto());

    expect(prisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' }, orderBy: { createdAt: 'desc' } }),
    );
    expect(result.data[0]).toMatchObject({ id: 'pay1', amount: 19.99 });
  });
});

describe('PaymentsService.listAll', () => {
  it('applies status and user filters', async () => {
    const prisma = buildPrismaMock();
    const service = await buildService(prisma);

    const query = Object.assign(new ListPaymentsQueryDto(), {
      status: PaymentStatus.SUCCEEDED,
      userId: 'u9',
    });
    await service.listAll(query);

    expect(prisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'SUCCEEDED', userId: 'u9' } }),
    );
  });
});

describe('PaymentsService.updateStatus', () => {
  it('404s when the payment is missing', async () => {
    const prisma = buildPrismaMock();
    prisma.payment.findUnique.mockResolvedValueOnce(null);
    const service = await buildService(prisma);
    await expect(
      service.updateStatus('nope', { status: PaymentStatus.SUCCEEDED }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an illegal transition', async () => {
    const prisma = buildPrismaMock();
    prisma.payment.findUnique.mockResolvedValueOnce(payRow({ status: PaymentStatus.PENDING }));
    const service = await buildService(prisma);
    await expect(
      service.updateStatus('pay1', { status: PaymentStatus.REFUNDED }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('is a no-op when the status is unchanged', async () => {
    const prisma = buildPrismaMock();
    prisma.payment.findUnique
      .mockResolvedValueOnce(payRow({ status: PaymentStatus.PENDING }))
      .mockResolvedValueOnce(adminPayRow({ status: PaymentStatus.PENDING }));
    const service = await buildService(prisma);

    const result = await service.updateStatus('pay1', { status: PaymentStatus.PENDING });

    expect(prisma.payment.update).not.toHaveBeenCalled();
    expect(result.status).toBe(PaymentStatus.PENDING);
  });

  it('settles PENDING → SUCCEEDED without touching the subscription', async () => {
    const prisma = buildPrismaMock();
    prisma.payment.findUnique.mockResolvedValueOnce(payRow({ status: PaymentStatus.PENDING }));
    prisma.payment.update.mockResolvedValueOnce(adminPayRow({ status: PaymentStatus.SUCCEEDED }));
    const service = await buildService(prisma);

    const result = await service.updateStatus('pay1', { status: PaymentStatus.SUCCEEDED });

    expect(prisma.subscription.updateMany).not.toHaveBeenCalled();
    expect(result.status).toBe(PaymentStatus.SUCCEEDED);
  });

  it('drops the subscription to PAST_DUE on a FAILED payment', async () => {
    const prisma = buildPrismaMock();
    prisma.payment.findUnique.mockResolvedValueOnce(payRow({ status: PaymentStatus.PENDING }));
    prisma.payment.update.mockResolvedValueOnce(adminPayRow({ status: PaymentStatus.FAILED }));
    const service = await buildService(prisma);

    await service.updateStatus('pay1', { status: PaymentStatus.FAILED });

    expect(prisma.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: SubscriptionStatus.PAST_DUE } }),
    );
  });

  it('cancels the subscription on a REFUNDED payment', async () => {
    const prisma = buildPrismaMock();
    prisma.payment.findUnique.mockResolvedValueOnce(payRow({ status: PaymentStatus.SUCCEEDED }));
    prisma.payment.update.mockResolvedValueOnce(adminPayRow({ status: PaymentStatus.REFUNDED }));
    const service = await buildService(prisma);

    await service.updateStatus('pay1', { status: PaymentStatus.REFUNDED });

    expect(prisma.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: SubscriptionStatus.CANCELED } }),
    );
  });
});
