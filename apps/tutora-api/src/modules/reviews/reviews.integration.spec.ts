import { Server } from 'node:http';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule } from '@/prisma/prisma.module';
import { PrismaService } from '@/prisma/prisma.service';
import { ReviewsModule } from './reviews.module';

const ENV = {
  JWT_ACCESS_SECRET: 'access-secret-for-tests',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'refresh-secret-for-tests',
  JWT_REFRESH_EXPIRES_IN: '7d',
  GOOGLE_CLIENT_ID: 'client-id',
};

function makeReview(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rev1',
    rating: 5,
    comment: 'Great',
    status: 'PUBLISHED',
    hiddenReason: null,
    moderatedById: null,
    moderatedAt: null,
    createdAt: new Date('2026-04-01T00:00:00Z'),
    updatedAt: new Date('2026-04-01T00:00:00Z'),
    student: { id: 'sp1', user: { name: 'Bob', avatarUrl: null } },
    tutor: { id: 'tp1', user: { name: 'Ada' } },
    ...overrides,
  };
}

describe('Reviews module (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let jwt: JwtService;

  const prismaMock = {
    studentProfile: { findUnique: jest.fn().mockResolvedValue({ id: 'sp1' }), create: jest.fn() },
    application: {
      findFirst: jest.fn().mockResolvedValue({ id: 'app1', tutorId: 'tp1', status: 'COMPLETED' }),
    },
    review: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([makeReview()]),
      count: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockResolvedValue(makeReview()),
      update: jest.fn().mockResolvedValue(makeReview()),
      aggregate: jest.fn().mockResolvedValue({ _avg: { rating: 5 }, _count: { _all: 1 } }),
    },
    tutorProfile: { update: jest.fn() },
    $transaction: jest.fn(),
  };
  // Handle both the array and interactive-callback transaction forms.
  prismaMock.$transaction.mockImplementation((arg: unknown) =>
    Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: unknown) => unknown)(prismaMock),
  );

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [() => ENV] }),
        PrismaModule,
        ReviewsModule,
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

  it('GET /tutors/:tutorId/reviews is public and returns a paginated envelope', async () => {
    const res = await request(httpServer).get('/api/v1/tutors/tp1/reviews').expect(200);
    expect(res.body).toHaveProperty('meta');
    expect(res.body).toMatchObject({ data: [{ id: 'rev1', rating: 5 }] });
  });

  it('POST /reviews requires authentication', async () => {
    await request(httpServer)
      .post('/api/v1/reviews')
      .send({ applicationId: 'app1', rating: 5 })
      .expect(401);
  });

  it('POST /reviews forbids a TUTOR', async () => {
    await request(httpServer)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${token('TUTOR')}`)
      .send({ applicationId: 'app1', rating: 5 })
      .expect(403);
  });

  it('POST /reviews creates a review for a STUDENT', async () => {
    const res = await request(httpServer)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${token('STUDENT')}`)
      .send({ applicationId: 'app1', rating: 5, comment: 'Great' })
      .expect(201);
    expect(res.body).toMatchObject({ id: 'rev1', rating: 5 });
  });

  it('POST /reviews rejects an out-of-range rating with 400', async () => {
    await request(httpServer)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${token('STUDENT')}`)
      .send({ applicationId: 'app1', rating: 9 })
      .expect(400);
  });

  it('PATCH /admin/reviews/:id/moderate forbids a STUDENT and allows an ADMIN', async () => {
    prismaMock.review.findFirst.mockResolvedValue({ id: 'rev1', tutorId: 'tp1' });

    await request(httpServer)
      .patch('/api/v1/admin/reviews/rev1/moderate')
      .set('Authorization', `Bearer ${token('STUDENT')}`)
      .send({ status: 'HIDDEN' })
      .expect(403);

    await request(httpServer)
      .patch('/api/v1/admin/reviews/rev1/moderate')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .send({ status: 'HIDDEN', hiddenReason: 'spam' })
      .expect(200);
  });
});
