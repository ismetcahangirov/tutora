import { Server } from 'node:http';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule } from '@/prisma/prisma.module';
import { PrismaService } from '@/prisma/prisma.service';
import { UsersModule } from './users.module';

const ENV = {
  JWT_ACCESS_SECRET: 'access-secret-for-tests',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'refresh-secret-for-tests',
  JWT_REFRESH_EXPIRES_IN: '7d',
  GOOGLE_CLIENT_ID: 'client-id',
};

const dbUser = {
  id: 'user-1',
  email: 'ada@example.com',
  name: 'Ada',
  avatarUrl: null,
  role: 'STUDENT',
  onboardingCompleted: true,
};

describe('GET /api/v1/users/me (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let jwt: JwtService;

  const prismaMock = {
    user: {
      findUnique: jest.fn().mockResolvedValue(dbUser),
      update: jest.fn().mockResolvedValue({ ...dbUser, role: 'TUTOR', onboardingCompleted: true }),
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [() => ENV] }),
        PrismaModule,
        UsersModule,
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

  function signAccessToken(): string {
    return jwt.sign(
      {
        sub: 'user-1',
        email: 'ada@example.com',
        role: 'STUDENT',
        onboardingCompleted: true,
      },
      { secret: ENV.JWT_ACCESS_SECRET, expiresIn: '15m' },
    );
  }

  it('returns 401 without an Authorization header', async () => {
    await request(httpServer).get('/api/v1/users/me').expect(401);
  });

  it('returns 401 with an invalid token', async () => {
    await request(httpServer)
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer not-a-real-token')
      .expect(401);
  });

  it('returns 200 with the current user for a valid access token', async () => {
    const res = await request(httpServer)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${signAccessToken()}`)
      .expect(200);

    const body = res.body as { id: string; email: string; role: string };
    expect(body).toMatchObject({
      id: 'user-1',
      email: 'ada@example.com',
      role: 'STUDENT',
      onboardingCompleted: true,
    });
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
  });

  it('PATCH /me returns 401 without an Authorization header', async () => {
    await request(httpServer).patch('/api/v1/users/me').send({ role: 'TUTOR' }).expect(401);
  });

  it('PATCH /me rejects a non-selectable role (ADMIN) with 400', async () => {
    await request(httpServer)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${signAccessToken()}`)
      .send({ role: 'ADMIN' })
      .expect(400);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('PATCH /me rejects a missing role with 400', async () => {
    await request(httpServer)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${signAccessToken()}`)
      .send({})
      .expect(400);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('PATCH /me sets the role, completes onboarding, and returns the updated summary', async () => {
    const res = await request(httpServer)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${signAccessToken()}`)
      .send({ role: 'TUTOR' })
      .expect(200);

    const body = res.body as { id: string; role: string; onboardingCompleted: boolean };
    expect(body).toMatchObject({
      id: 'user-1',
      role: 'TUTOR',
      onboardingCompleted: true,
    });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { role: 'TUTOR', onboardingCompleted: true },
    });
  });
});
