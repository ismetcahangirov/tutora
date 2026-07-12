import { Server } from 'node:http';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule } from '@/prisma/prisma.module';
import { PrismaService } from '@/prisma/prisma.service';
import { StudentsModule } from './students.module';

const ENV = {
  JWT_ACCESS_SECRET: 'access-secret-for-tests',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'refresh-secret-for-tests',
  JWT_REFRESH_EXPIRES_IN: '7d',
  GOOGLE_CLIENT_ID: 'client-id',
};

const profile = {
  id: 'sp1',
  userId: 'u1',
  bio: null,
  educationLevel: null,
  deletedAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  user: { name: 'Bob', avatarUrl: null, email: 'bob@example.com' },
  _count: { favorites: 0 },
};

describe('Students module (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let jwt: JwtService;

  const prismaMock = {
    studentProfile: {
      findUnique: jest.fn().mockResolvedValue(profile),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(profile),
      update: jest.fn().mockResolvedValue(profile),
    },
    favorite: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      upsert: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    tutorProfile: { findFirst: jest.fn().mockResolvedValue({ id: 'tp1' }) },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [() => ENV] }),
        PrismaModule,
        StudentsModule,
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

  it('GET /students/me forbids a non-student (TUTOR)', async () => {
    await request(httpServer)
      .get('/api/v1/students/me')
      .set('Authorization', `Bearer ${token('TUTOR')}`)
      .expect(403);
  });

  it('GET /students/me returns the profile for a STUDENT', async () => {
    const res = await request(httpServer)
      .get('/api/v1/students/me')
      .set('Authorization', `Bearer ${token('STUDENT')}`)
      .expect(200);
    expect(res.body).toMatchObject({ id: 'sp1', userId: 'u1', favoritesCount: 0 });
  });

  it('PUT /students/me/favorites/:tutorId favorites a tutor with 204', async () => {
    await request(httpServer)
      .put('/api/v1/students/me/favorites/tp1')
      .set('Authorization', `Bearer ${token('STUDENT')}`)
      .expect(204);
    expect(prismaMock.favorite.upsert).toHaveBeenCalled();
  });

  it('PATCH /students/me rejects an invalid education level with 400', async () => {
    await request(httpServer)
      .patch('/api/v1/students/me')
      .set('Authorization', `Bearer ${token('STUDENT')}`)
      .send({ educationLevel: 'NOT_A_LEVEL' })
      .expect(400);
  });

  it('GET /admin/students forbids a STUDENT and allows an ADMIN', async () => {
    await request(httpServer)
      .get('/api/v1/admin/students')
      .set('Authorization', `Bearer ${token('STUDENT')}`)
      .expect(403);

    const res = await request(httpServer)
      .get('/api/v1/admin/students')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .expect(200);
    expect(res.body).toHaveProperty('meta');
  });
});
