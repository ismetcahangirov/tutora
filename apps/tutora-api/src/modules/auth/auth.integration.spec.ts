import { createHmac } from 'node:crypto';
import { Server } from 'node:http';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule } from '@/prisma/prisma.module';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthModule } from './auth.module';
import { GoogleVerifierService } from './services/google-verifier.service';

const ENV = {
  JWT_ACCESS_SECRET: 'access-secret-for-tests',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'refresh-secret-for-tests',
  JWT_REFRESH_EXPIRES_IN: '7d',
  GOOGLE_CLIENT_ID: 'client-id',
};

const fakeUser = {
  id: 'user-1',
  email: 'ada@example.com',
  name: 'Ada',
  avatarUrl: null,
  role: null,
  onboardingCompleted: false,
};

function hashRefresh(token: string): string {
  return createHmac('sha256', ENV.JWT_REFRESH_SECRET).update(token).digest('hex');
}

describe('POST /api/v1/auth/google (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;

  const prismaMock = {
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(fakeUser),
    },
    refreshToken: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };
  const verifierMock = {
    verify: jest.fn().mockResolvedValue({
      googleId: 'g1',
      email: 'ada@example.com',
      emailVerified: true,
      name: 'Ada',
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [() => ENV] }),
        PrismaModule,
        AuthModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock as unknown as PrismaService)
      .overrideProvider(GoogleVerifierService)
      .useValue(verifierMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 with tokens and user for a valid idToken', async () => {
    const res = await request(httpServer)
      .post('/api/v1/auth/google')
      .send({ idToken: 'valid-id-token' })
      .expect(200);

    const body = res.body as { accessToken: unknown; refreshToken: unknown; user: unknown };
    expect(typeof body.accessToken).toBe('string');
    expect(typeof body.refreshToken).toBe('string');
    expect(body.user).toMatchObject({ id: 'user-1', email: 'ada@example.com', role: null });
    expect(prismaMock.refreshToken.create).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when idToken is missing', async () => {
    await request(httpServer).post('/api/v1/auth/google').send({}).expect(400);
  });
});

describe('POST /api/v1/auth/refresh + /logout (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;

  const prismaMock = {
    user: {
      findUnique: jest.fn().mockResolvedValue(fakeUser),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };
  const verifierMock = { verify: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [() => ENV] }),
        PrismaModule,
        AuthModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock as unknown as PrismaService)
      .overrideProvider(GoogleVerifierService)
      .useValue(verifierMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    prismaMock.refreshToken.findUnique.mockReset();
    prismaMock.refreshToken.update.mockClear();
    prismaMock.refreshToken.updateMany.mockClear();
    prismaMock.refreshToken.create.mockClear();
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 0 });
  });

  it('rotates a valid refresh token: 200 with a fresh, distinct token pair', async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      userId: 'user-1',
      tokenHash: hashRefresh('valid-refresh'),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });

    const res = await request(httpServer)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'valid-refresh' })
      .expect(200);

    const body = res.body as { accessToken: unknown; refreshToken: unknown };
    expect(typeof body.accessToken).toBe('string');
    expect(typeof body.refreshToken).toBe('string');
    expect(body.refreshToken).not.toBe('valid-refresh');
    // Old row revoked, new row created.
    expect(prismaMock.refreshToken.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.refreshToken.create).toHaveBeenCalledTimes(1);
  });

  it('detects reuse of an already-revoked token: 401 and bulk-revokes the user tokens', async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      userId: 'user-1',
      tokenHash: hashRefresh('reused-refresh'),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(Date.now() - 1_000),
    });

    await request(httpServer)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'reused-refresh' })
      .expect(401);

    const revokeAllArg = (
      prismaMock.refreshToken.updateMany.mock.calls[0] as [
        { where: { userId: string; revokedAt: null }; data: { revokedAt: Date } },
      ]
    )[0];
    expect(revokeAllArg.where).toEqual({ userId: 'user-1', revokedAt: null });
    expect(revokeAllArg.data.revokedAt).toBeInstanceOf(Date);
    expect(prismaMock.refreshToken.create).not.toHaveBeenCalled();
  });

  it('returns 401 for an unknown refresh token', async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValue(null);

    await request(httpServer)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'ghost' })
      .expect(401);
  });

  it('returns 400 when the refreshToken is missing', async () => {
    await request(httpServer).post('/api/v1/auth/refresh').send({}).expect(400);
  });

  it('logs out (revokes) a refresh token: 204 and no leak for unknown tokens', async () => {
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 0 });

    await request(httpServer)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: 'anything' })
      .expect(204);

    const revokeArg = (
      prismaMock.refreshToken.updateMany.mock.calls[0] as [
        { where: { tokenHash: string; revokedAt: null }; data: { revokedAt: Date } },
      ]
    )[0];
    expect(revokeArg.where).toEqual({ tokenHash: hashRefresh('anything'), revokedAt: null });
    expect(revokeArg.data.revokedAt).toBeInstanceOf(Date);
  });
});
