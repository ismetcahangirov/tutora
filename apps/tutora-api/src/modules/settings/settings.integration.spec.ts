import { Server } from 'node:http';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule } from '@/prisma/prisma.module';
import { PrismaService } from '@/prisma/prisma.service';
import { SettingsModule } from './settings.module';

const ENV = {
  JWT_ACCESS_SECRET: 'access-secret-for-tests',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'refresh-secret-for-tests',
  JWT_REFRESH_EXPIRES_IN: '7d',
  GOOGLE_CLIENT_ID: 'client-id',
};

const flagRow = {
  id: 'f1',
  key: 'in_app_payments',
  description: null,
  enabled: true,
  rolloutPercentage: 100,
  updatedById: 'admin-1',
  createdAt: new Date('2026-07-14T00:00:00Z'),
  updatedAt: new Date('2026-07-14T00:00:00Z'),
};

describe('Admin settings (integration RBAC + audit)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let jwt: JwtService;

  const prismaMock = {
    featureFlag: {
      findMany: jest.fn().mockResolvedValue([flagRow]),
      create: jest.fn().mockResolvedValue(flagRow),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [() => ENV] }),
        PrismaModule,
        SettingsModule,
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
      { sub: 'admin-1', email: 'admin@example.com', role, onboardingCompleted: true },
      { secret: ENV.JWT_ACCESS_SECRET, expiresIn: '15m' },
    );
  }

  it('rejects an anonymous flag listing with 401', async () => {
    await request(httpServer).get('/api/v1/admin/feature-flags').expect(401);
  });

  it('rejects a non-admin (TUTOR) with 403', async () => {
    await request(httpServer)
      .get('/api/v1/admin/feature-flags')
      .set('Authorization', `Bearer ${token('TUTOR')}`)
      .expect(403);
  });

  it('lists flags for an ADMIN', async () => {
    const res = await request(httpServer)
      .get('/api/v1/admin/feature-flags')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .expect(200);

    const body = res.body as unknown[];
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toMatchObject({ key: 'in_app_payments', enabled: true });
  });

  it('creates a flag and writes an audit entry', async () => {
    prismaMock.auditLog.create.mockClear();

    await request(httpServer)
      .post('/api/v1/admin/feature-flags')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .send({ key: 'new_flag', enabled: true, rolloutPercentage: 25 })
      .expect(201);

    expect(prismaMock.featureFlag.create).toHaveBeenCalled();
    expect(prismaMock.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid flag key with 400', async () => {
    await request(httpServer)
      .post('/api/v1/admin/feature-flags')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .send({ key: 'Invalid Key!' })
      .expect(400);
  });
});
