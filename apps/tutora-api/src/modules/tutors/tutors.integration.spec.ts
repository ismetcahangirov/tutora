import { Server } from 'node:http';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule } from '@/prisma/prisma.module';
import { PrismaService } from '@/prisma/prisma.service';
import { TutorsModule } from './tutors.module';

const ENV = {
  JWT_ACCESS_SECRET: 'access-secret-for-tests',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'refresh-secret-for-tests',
  JWT_REFRESH_EXPIRES_IN: '7d',
  GOOGLE_CLIENT_ID: 'client-id',
};

function makeProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tp1',
    userId: 'u1',
    bio: null,
    experienceYears: 0,
    hourlyRate: 0,
    currency: 'AZN',
    formats: [],
    verificationStatus: 'VERIFIED',
    ratingAvg: 0,
    ratingCount: 0,
    profileViews: 0,
    isPublished: true,
    deletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    user: { name: 'Ada', avatarUrl: null, email: 'ada@example.com' },
    subjects: [],
    districts: [],
    languages: [],
    certificates: [],
    ...overrides,
  };
}

describe('Tutors module (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let jwt: JwtService;

  const prismaMock = {
    tutorProfile: {
      findUnique: jest.fn().mockResolvedValue(makeProfile()),
      findFirst: jest.fn().mockResolvedValue(makeProfile()),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(makeProfile()),
      update: jest.fn().mockResolvedValue(makeProfile()),
    },
    tutorAvailability: {
      findMany: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [() => ENV] }),
        PrismaModule,
        TutorsModule,
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
      { sub: 'u1', email: 'ada@example.com', role, onboardingCompleted: true },
      { secret: ENV.JWT_ACCESS_SECRET, expiresIn: '15m' },
    );
  }

  it('GET /tutors/me requires authentication', async () => {
    await request(httpServer).get('/api/v1/tutors/me').expect(401);
  });

  it('GET /tutors/me forbids a non-tutor (STUDENT)', async () => {
    await request(httpServer)
      .get('/api/v1/tutors/me')
      .set('Authorization', `Bearer ${token('STUDENT')}`)
      .expect(403);
  });

  it('GET /tutors/me returns the profile for a TUTOR (not shadowed by /:id)', async () => {
    const res = await request(httpServer)
      .get('/api/v1/tutors/me')
      .set('Authorization', `Bearer ${token('TUTOR')}`)
      .expect(200);
    expect(res.body).toMatchObject({ id: 'tp1', userId: 'u1' });
  });

  it('GET /tutors/:id is public and returns a published profile', async () => {
    const res = await request(httpServer).get('/api/v1/tutors/tp1').expect(200);
    expect(res.body).toMatchObject({ id: 'tp1', name: 'Ada' });
    expect(res.body).not.toHaveProperty('profileViews');
  });

  it('PATCH /tutors/me rejects publishing an unverified profile with 409', async () => {
    prismaMock.tutorProfile.findUnique.mockResolvedValueOnce(
      makeProfile({ verificationStatus: 'UNVERIFIED', isPublished: false }),
    );
    await request(httpServer)
      .patch('/api/v1/tutors/me')
      .set('Authorization', `Bearer ${token('TUTOR')}`)
      .send({ isPublished: true })
      .expect(409);
  });

  it('PATCH /tutors/me validates hourlyRate bounds with 400', async () => {
    await request(httpServer)
      .patch('/api/v1/tutors/me')
      .set('Authorization', `Bearer ${token('TUTOR')}`)
      .send({ hourlyRate: -5 })
      .expect(400);
  });

  it('GET /tutors/me/availability forbids a STUDENT and returns a list for a TUTOR', async () => {
    await request(httpServer)
      .get('/api/v1/tutors/me/availability')
      .set('Authorization', `Bearer ${token('STUDENT')}`)
      .expect(403);

    prismaMock.tutorAvailability.findMany.mockResolvedValueOnce([
      {
        id: 'a1',
        tutorId: 'tp1',
        weekday: 'MON',
        startMinute: 540,
        endMinute: 660,
        createdAt: new Date(),
      },
    ]);
    const res = await request(httpServer)
      .get('/api/v1/tutors/me/availability')
      .set('Authorization', `Bearer ${token('TUTOR')}`)
      .expect(200);
    expect(res.body).toEqual([{ id: 'a1', weekday: 'MON', startMinute: 540, endMinute: 660 }]);
  });

  it('PUT /tutors/me/availability replaces the week for a TUTOR', async () => {
    await request(httpServer)
      .put('/api/v1/tutors/me/availability')
      .set('Authorization', `Bearer ${token('TUTOR')}`)
      .send({ slots: [{ weekday: 'MON', startMinute: 540, endMinute: 660 }] })
      .expect(200);
    expect(prismaMock.tutorAvailability.deleteMany).toHaveBeenCalled();
    expect(prismaMock.tutorAvailability.createMany).toHaveBeenCalled();
  });

  it('PUT /tutors/me/availability rejects overlapping windows with 400', async () => {
    await request(httpServer)
      .put('/api/v1/tutors/me/availability')
      .set('Authorization', `Bearer ${token('TUTOR')}`)
      .send({
        slots: [
          { weekday: 'MON', startMinute: 540, endMinute: 660 },
          { weekday: 'MON', startMinute: 600, endMinute: 780 },
        ],
      })
      .expect(400);
  });

  it('PUT /tutors/me/availability rejects an out-of-range minute with 400', async () => {
    await request(httpServer)
      .put('/api/v1/tutors/me/availability')
      .set('Authorization', `Bearer ${token('TUTOR')}`)
      .send({ slots: [{ weekday: 'MON', startMinute: -1, endMinute: 660 }] })
      .expect(400);
  });

  it('GET /admin/tutors forbids a TUTOR and allows an ADMIN', async () => {
    await request(httpServer)
      .get('/api/v1/admin/tutors')
      .set('Authorization', `Bearer ${token('TUTOR')}`)
      .expect(403);

    const res = await request(httpServer)
      .get('/api/v1/admin/tutors')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .expect(200);
    expect(res.body).toHaveProperty('meta');
  });
});
