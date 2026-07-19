import { Prisma, UserRole } from '@prisma/client';
import request from 'supertest';
import { bootstrapE2EApp, signAccessToken, type E2EApp } from '../utils/e2e-app';

/**
 * The flagship critical-path journey (#96, #99): a single student token, issued
 * by the app's own signing key, authorizes calls across the search, applications
 * and billing modules — and a tutor token acts on the same application. No
 * existing test crosses module boundaries with one principal; the per-module
 * integration specs each boot one module in isolation. Infrastructure is mocked
 * so the suite needs no Postgres/Redis, but the HTTP surface, guards, role
 * checks and validation are the real composed app.
 */

const AT = new Date('2026-07-01T00:00:00Z');

function tutorSearchRow() {
  return {
    id: 'tp1',
    bio: 'Experienced maths tutor',
    experienceYears: 5,
    hourlyRateCache: 30,
    currency: 'AZN',
    formats: ['ONLINE'],
    verificationStatus: 'VERIFIED',
    ratingAvg: 4.7,
    ratingCount: 12,
    user: { name: 'Ada', avatarUrl: null },
    subjects: [{ subjectId: 's1', subject: { name: 'Maths', slug: 'maths' } }],
    districts: [],
    languages: [],
  };
}

function planRow() {
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
  };
}

function subscriptionRow() {
  return {
    id: 'sub1',
    userId: 'student-user',
    planId: 'plan-pro',
    status: 'ACTIVE',
    currentPeriodStart: AT,
    currentPeriodEnd: new Date('2026-07-31T00:00:00Z'),
    createdAt: AT,
    updatedAt: AT,
    plan: { tier: 'PRO', name: 'Pro', entitlements: null },
  };
}

function applicationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'app1',
    status: 'PENDING',
    message: 'Hello, I need help with calculus',
    format: null,
    subject: null,
    respondedAt: null,
    createdAt: AT,
    updatedAt: AT,
    student: { id: 'sp1', user: { name: 'Bob', avatarUrl: null } },
    tutor: { id: 'tp1', user: { name: 'Ada', avatarUrl: null } },
    ...overrides,
  };
}

describe('Student critical-path journey (e2e)', () => {
  let e2e: E2EApp;
  let studentToken = '';
  let tutorToken = '';

  const prisma = {
    // Search
    tutorProfile: {
      findMany: jest.fn().mockResolvedValue([tutorSearchRow()]),
      count: jest.fn().mockResolvedValue(1),
      findFirst: jest.fn().mockResolvedValue({ id: 'tp1' }),
      findUnique: jest.fn().mockResolvedValue({ id: 'tp1' }),
    },
    // Applications
    studentProfile: {
      findUnique: jest.fn().mockResolvedValue({ id: 'sp1' }),
      create: jest.fn().mockResolvedValue({ id: 'sp1' }),
    },
    subject: { findUnique: jest.fn().mockResolvedValue({ id: 's1' }) },
    application: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([applicationRow()]),
      count: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockResolvedValue(applicationRow()),
      update: jest.fn().mockResolvedValue(applicationRow({ status: 'ACCEPTED' })),
    },
    // Billing
    plan: {
      findMany: jest.fn().mockResolvedValue([planRow()]),
      findFirst: jest.fn().mockResolvedValue(planRow()),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    subscription: {
      findFirst: jest.fn().mockResolvedValue(subscriptionRow()),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue(subscriptionRow()),
    },
    payment: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((arg: unknown) =>
    Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: unknown) => unknown)(prisma),
  );

  beforeAll(async () => {
    e2e = await bootstrapE2EApp({ prisma });
    studentToken = signAccessToken(e2e.jwt, { sub: 'student-user', role: UserRole.STUDENT });
    tutorToken = signAccessToken(e2e.jwt, { sub: 'tutor-user', role: UserRole.TUTOR });
  });

  afterAll(async () => {
    await e2e.app.close();
  });

  it('discovers a tutor via the public search endpoint', async () => {
    const res = await request(e2e.httpServer).get('/api/v1/search/tutors').expect(200);
    expect(res.body).toHaveProperty('meta');
    expect(res.body).toMatchObject({ data: [{ id: 'tp1', name: 'Ada' }] });
  });

  it('reads the public plan catalogue', async () => {
    const res = await request(e2e.httpServer).get('/api/v1/plans').expect(200);
    expect(res.body).toMatchObject([{ tier: 'PRO', priceMonthly: 19.99 }]);
  });

  it('rejects an anonymous application with 401', async () => {
    await request(e2e.httpServer).post('/api/v1/applications').send({ tutorId: 'tp1' }).expect(401);
  });

  it('forbids a TUTOR from applying (403)', async () => {
    await request(e2e.httpServer)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ tutorId: 'tp1' })
      .expect(403);
  });

  it('lets the student apply to the tutor', async () => {
    const res = await request(e2e.httpServer)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ tutorId: 'tp1', message: 'Hello, I need help with calculus' })
      .expect(201);
    expect(res.body).toMatchObject({ id: 'app1', status: 'PENDING' });
  });

  it('validates the application body (missing tutorId → 400)', async () => {
    await request(e2e.httpServer)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ message: 'no tutor' })
      .expect(400);
  });

  it('lists the student’s own applications', async () => {
    const res = await request(e2e.httpServer)
      .get('/api/v1/applications')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(res.body).toMatchObject({ data: [{ id: 'app1' }], meta: { total: 1 } });
  });

  it('forbids the student from the tutor inbox (403)', async () => {
    await request(e2e.httpServer)
      .get('/api/v1/tutor/applications')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);
  });

  it('lets the tutor see and accept the application', async () => {
    const inbox = await request(e2e.httpServer)
      .get('/api/v1/tutor/applications')
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(200);
    expect(inbox.body).toMatchObject({ data: [{ id: 'app1' }] });

    prisma.application.findFirst.mockResolvedValueOnce({ id: 'app1', status: 'PENDING' });
    const accepted = await request(e2e.httpServer)
      .post('/api/v1/tutor/applications/app1/accept')
      .set('Authorization', `Bearer ${tutorToken}`)
      .expect(200);
    expect(accepted.body).toMatchObject({ status: 'ACCEPTED' });
  });

  it('lets the student subscribe to PRO and then read the active subscription', async () => {
    prisma.subscription.findFirst.mockResolvedValueOnce(null); // no effective sub yet
    const subscribed = await request(e2e.httpServer)
      .post('/api/v1/billing/subscribe')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ tier: 'PRO' })
      .expect(201);
    expect(subscribed.body).toMatchObject({ tier: 'PRO', status: 'ACTIVE' });

    const summary = await request(e2e.httpServer)
      .get('/api/v1/billing/subscription')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(summary.body).toMatchObject({ tier: 'PRO' });
  });

  it('rejects subscribing to an unknown tier with 400', async () => {
    await request(e2e.httpServer)
      .post('/api/v1/billing/subscribe')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ tier: 'ENTERPRISE' })
      .expect(400);
  });
});
