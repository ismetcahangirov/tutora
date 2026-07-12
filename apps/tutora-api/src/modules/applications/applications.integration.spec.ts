import { Server } from 'node:http';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule } from '@/prisma/prisma.module';
import { PrismaService } from '@/prisma/prisma.service';
import { ApplicationsModule } from './applications.module';

const ENV = {
  JWT_ACCESS_SECRET: 'access-secret-for-tests',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'refresh-secret-for-tests',
  JWT_REFRESH_EXPIRES_IN: '7d',
  GOOGLE_CLIENT_ID: 'client-id',
};

function makeApplication(overrides: Record<string, unknown> = {}) {
  return {
    id: 'app1',
    status: 'PENDING',
    message: null,
    format: null,
    subject: null,
    respondedAt: null,
    createdAt: new Date('2026-03-01T00:00:00Z'),
    updatedAt: new Date('2026-03-01T00:00:00Z'),
    student: { id: 'sp1', user: { name: 'Bob', avatarUrl: null } },
    tutor: { id: 'tp1', user: { name: 'Ada', avatarUrl: null } },
    ...overrides,
  };
}

describe('Applications module (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let jwt: JwtService;

  const prismaMock = {
    studentProfile: { findUnique: jest.fn().mockResolvedValue({ id: 'sp1' }), create: jest.fn() },
    tutorProfile: {
      findUnique: jest.fn().mockResolvedValue({ id: 'tp1' }),
      findFirst: jest.fn().mockResolvedValue({ id: 'tp1' }),
    },
    subject: { findUnique: jest.fn().mockResolvedValue({ id: 's1' }) },
    application: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([makeApplication()]),
      count: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockResolvedValue(makeApplication()),
      update: jest.fn().mockResolvedValue(makeApplication({ status: 'ACCEPTED' })),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [() => ENV] }),
        PrismaModule,
        ApplicationsModule,
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

  it('POST /applications requires authentication', async () => {
    await request(httpServer).post('/api/v1/applications').send({ tutorId: 'tp1' }).expect(401);
  });

  it('POST /applications forbids a TUTOR', async () => {
    await request(httpServer)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${token('TUTOR')}`)
      .send({ tutorId: 'tp1' })
      .expect(403);
  });

  it('POST /applications creates for a STUDENT', async () => {
    const res = await request(httpServer)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${token('STUDENT')}`)
      .send({ tutorId: 'tp1', message: 'Hello' })
      .expect(201);
    expect(res.body).toMatchObject({ id: 'app1', status: 'PENDING' });
  });

  it('POST /applications rejects a missing tutorId with 400', async () => {
    await request(httpServer)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${token('STUDENT')}`)
      .send({ message: 'Hello' })
      .expect(400);
  });

  it('GET /tutor/applications forbids a STUDENT and allows a TUTOR', async () => {
    await request(httpServer)
      .get('/api/v1/tutor/applications')
      .set('Authorization', `Bearer ${token('STUDENT')}`)
      .expect(403);

    const res = await request(httpServer)
      .get('/api/v1/tutor/applications')
      .set('Authorization', `Bearer ${token('TUTOR')}`)
      .expect(200);
    expect(res.body).toHaveProperty('meta');
  });

  it('POST /tutor/applications/:id/accept transitions a pending application', async () => {
    prismaMock.application.findFirst.mockResolvedValueOnce({ id: 'app1', status: 'PENDING' });
    const res = await request(httpServer)
      .post('/api/v1/tutor/applications/app1/accept')
      .set('Authorization', `Bearer ${token('TUTOR')}`)
      .expect(200);
    expect(res.body).toMatchObject({ status: 'ACCEPTED' });
  });

  it('POST /tutor/applications/:id/complete rejects an illegal transition with 409', async () => {
    prismaMock.application.findFirst.mockResolvedValueOnce({ id: 'app1', status: 'PENDING' });
    await request(httpServer)
      .post('/api/v1/tutor/applications/app1/complete')
      .set('Authorization', `Bearer ${token('TUTOR')}`)
      .expect(409);
  });
});
