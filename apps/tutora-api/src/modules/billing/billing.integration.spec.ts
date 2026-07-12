import { Server } from 'node:http';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import { PrismaModule } from '@/prisma/prisma.module';
import { PrismaService } from '@/prisma/prisma.service';
import { BillingModule } from './billing.module';

const ENV = {
  JWT_ACCESS_SECRET: 'access-secret-for-tests',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'refresh-secret-for-tests',
  JWT_REFRESH_EXPIRES_IN: '7d',
  GOOGLE_CLIENT_ID: 'client-id',
};

const AT = new Date('2026-07-01T00:00:00Z');

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
    status: 'ACTIVE',
    currentPeriodStart: AT,
    currentPeriodEnd: new Date('2026-07-31T00:00:00Z'),
    createdAt: AT,
    updatedAt: AT,
    plan: { tier: 'PRO', name: 'Pro', entitlements: null },
    ...overrides,
  };
}

describe('Billing module (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let jwt: JwtService;

  const prismaMock = {
    plan: {
      findMany: jest.fn().mockResolvedValue([planRow()]),
      findFirst: jest.fn().mockResolvedValue(planRow()),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(planRow()),
    },
    subscription: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(subRow()),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    payment: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn(),
  };
  prismaMock.$transaction.mockImplementation((arg: unknown) =>
    Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: unknown) => unknown)(prismaMock),
  );

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [() => ENV] }),
        PrismaModule,
        BillingModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    httpServer = app.getHttpServer() as Server;
    jwt = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  function token(role: string | null): string {
    return jwt.sign(
      { sub: 'u1', email: 'bob@example.com', role, onboardingCompleted: true },
      { secret: ENV.JWT_ACCESS_SECRET, expiresIn: '15m' },
    );
  }

  it('GET /plans is public and lists active plans with resolved entitlements', async () => {
    const res = await request(httpServer).get('/api/v1/plans').expect(200);
    expect(res.body).toMatchObject([
      { tier: 'PRO', priceMonthly: 19.99, entitlements: { analytics: true } },
    ]);
  });

  it('GET /billing/subscription requires authentication', async () => {
    await request(httpServer).get('/api/v1/billing/subscription').expect(401);
  });

  it('GET /billing/subscription returns the FREE fallback when the user has none', async () => {
    prismaMock.subscription.findFirst.mockResolvedValueOnce(null);
    prismaMock.plan.findUnique.mockResolvedValueOnce(
      planRow({
        id: 'plan-free',
        tier: 'FREE',
        name: 'Free',
        priceMonthly: new Prisma.Decimal('0'),
      }),
    );

    const res = await request(httpServer)
      .get('/api/v1/billing/subscription')
      .set('Authorization', `Bearer ${token('STUDENT')}`)
      .expect(200);

    expect(res.body).toMatchObject({ tier: 'FREE', subscription: null });
  });

  it('POST /billing/subscribe subscribes the caller to a plan', async () => {
    prismaMock.plan.findFirst.mockResolvedValueOnce(planRow());
    prismaMock.subscription.findFirst.mockResolvedValueOnce(null);
    prismaMock.subscription.create.mockResolvedValueOnce(subRow());

    const res = await request(httpServer)
      .post('/api/v1/billing/subscribe')
      .set('Authorization', `Bearer ${token('STUDENT')}`)
      .send({ tier: 'PRO' })
      .expect(201);

    expect(res.body).toMatchObject({ tier: 'PRO', status: 'ACTIVE' });
  });

  it('POST /billing/subscribe rejects an unknown tier with 400', async () => {
    await request(httpServer)
      .post('/api/v1/billing/subscribe')
      .set('Authorization', `Bearer ${token('STUDENT')}`)
      .send({ tier: 'ENTERPRISE' })
      .expect(400);
  });

  it('POST /admin/plans forbids a STUDENT and allows an ADMIN', async () => {
    await request(httpServer)
      .post('/api/v1/admin/plans')
      .set('Authorization', `Bearer ${token('STUDENT')}`)
      .send({ tier: 'PRO', name: 'Pro', priceMonthly: 19.99 })
      .expect(403);

    prismaMock.plan.create.mockResolvedValueOnce(planRow());
    await request(httpServer)
      .post('/api/v1/admin/plans')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .send({ tier: 'PRO', name: 'Pro', priceMonthly: 19.99 })
      .expect(201);
  });

  it('GET /admin/subscriptions forbids a non-admin', async () => {
    await request(httpServer)
      .get('/api/v1/admin/subscriptions')
      .set('Authorization', `Bearer ${token('TUTOR')}`)
      .expect(403);
  });
});
