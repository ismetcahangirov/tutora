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

describe('POST /api/v1/auth/google (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;

  const prismaMock = {
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(fakeUser),
    },
    refreshToken: { create: jest.fn().mockResolvedValue({}) },
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
