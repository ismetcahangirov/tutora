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

const adminRow = {
  id: 'admin-1',
  email: 'admin@example.com',
  emailVerified: true,
  name: 'Admin',
  avatarUrl: null,
  locale: 'az',
  provider: 'GOOGLE',
  googleId: 'g-admin',
  role: 'ADMIN',
  onboardingCompleted: true,
  deletedAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('Admin users (integration RBAC)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let jwt: JwtService;

  const prismaMock = {
    user: {
      findUnique: jest.fn().mockResolvedValue(adminRow),
      findMany: jest.fn().mockResolvedValue([adminRow]),
      count: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockResolvedValue(adminRow),
      update: jest.fn().mockResolvedValue(adminRow),
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

  function token(role: string | null): string {
    return jwt.sign(
      { sub: 'principal', email: 'p@example.com', role, onboardingCompleted: true },
      { secret: ENV.JWT_ACCESS_SECRET, expiresIn: '15m' },
    );
  }

  it('rejects an anonymous request with 401', async () => {
    await request(httpServer).get('/api/v1/admin/users').expect(401);
  });

  it('rejects a non-admin (STUDENT) with 403', async () => {
    await request(httpServer)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${token('STUDENT')}`)
      .expect(403);
  });

  it('returns a paginated envelope for an ADMIN', async () => {
    const res = await request(httpServer)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .expect(200);

    const body = res.body as { data: unknown[]; meta: Record<string, unknown> };
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('meta');
    expect(body.meta).toMatchObject({ total: 1, page: 1, limit: 20 });
    expect(body.data[0]).not.toHaveProperty('googleId');
  });

  it('validates pagination bounds (limit over the max) with 400', async () => {
    await request(httpServer)
      .get('/api/v1/admin/users?limit=9999')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .expect(400);
  });
});
