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
  deletedAt: null,
};

describe('Users self-service (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let jwt: JwtService;

  const prismaMock = {
    user: {
      findUnique: jest.fn().mockResolvedValue(dbUser),
      update: jest
        .fn()
        .mockImplementation(({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ ...dbUser, ...data }),
        ),
    },
    refreshToken: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
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

  beforeEach(() => {
    prismaMock.user.update.mockClear();
    prismaMock.refreshToken.updateMany.mockClear();
  });

  function signAccessToken(role: string | null = 'STUDENT'): string {
    return jwt.sign(
      { sub: 'user-1', email: 'ada@example.com', role, onboardingCompleted: true },
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

    expect(res.body).toMatchObject({
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

  it('PATCH /me accepts an empty body as a no-op and returns the summary', async () => {
    await request(httpServer)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${signAccessToken()}`)
      .send({})
      .expect(200);
    expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: {} });
  });

  it('PATCH /me updates profile fields', async () => {
    const res = await request(httpServer)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${signAccessToken()}`)
      .send({ name: 'Ada L.' })
      .expect(200);
    expect(res.body).toMatchObject({ name: 'Ada L.' });
  });

  it('PATCH /me sets the role and completes onboarding for a not-yet-onboarded user', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ ...dbUser, onboardingCompleted: false });

    const res = await request(httpServer)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${signAccessToken()}`)
      .send({ role: 'TUTOR' })
      .expect(200);

    expect(res.body).toMatchObject({ id: 'user-1', role: 'TUTOR', onboardingCompleted: true });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { role: 'TUTOR', onboardingCompleted: true },
    });
  });

  it('PATCH /me rejects a role change once onboarding is already complete, with 403', async () => {
    await request(httpServer)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${signAccessToken()}`)
      .send({ role: 'TUTOR' })
      .expect(403);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('DELETE /me soft-deletes the account and returns 204', async () => {
    await request(httpServer)
      .delete('/api/v1/users/me')
      .set('Authorization', `Bearer ${signAccessToken()}`)
      .expect(204);

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } }),
    );
    const calls = prismaMock.user.update.mock.calls as Array<[{ data: { deletedAt: unknown } }]>;
    expect(calls.at(-1)?.[0]?.data.deletedAt).toBeInstanceOf(Date);
    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalled();
  });
});
