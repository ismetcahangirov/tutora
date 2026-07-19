import { Server } from 'node:http';
import { Global, INestApplication, Module, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule } from '@/prisma/prisma.module';
import { PrismaService } from '@/prisma/prisma.service';
import { CacheService } from '@common/cache/cache.service';
import { TaxonomyModule } from './taxonomy.module';

const ENV = {
  JWT_ACCESS_SECRET: 'access-secret-for-tests',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'refresh-secret-for-tests',
  JWT_REFRESH_EXPIRES_IN: '7d',
  GOOGLE_CLIENT_ID: 'client-id',
};

// Stubs the global CacheService so the module runs without Redis: reads pass
// straight through to Prisma (getOrSet runs the loader) and invalidation is a no-op.
const cacheStub = {
  getOrSet: (_key: string, _ttl: number, loader: () => Promise<unknown>) => loader(),
  deleteByPrefix: jest.fn().mockResolvedValue(undefined),
};

@Global()
@Module({
  providers: [{ provide: CacheService, useValue: cacheStub }],
  exports: [CacheService],
})
class StubCacheModule {}

describe('Taxonomy module (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let jwt: JwtService;

  const prismaMock = {
    category: {
      findMany: jest.fn().mockResolvedValue([{ id: 'c1', name: 'Sciences', slug: 'sciences' }]),
      create: jest.fn().mockResolvedValue({ id: 'c2', name: 'Arts', slug: 'arts' }),
    },
    subject: { findMany: jest.fn().mockResolvedValue([]) },
    city: { findMany: jest.fn().mockResolvedValue([{ id: 'cty1', name: 'Baku', slug: 'baku' }]) },
    district: { findMany: jest.fn().mockResolvedValue([]) },
    language: { findMany: jest.fn().mockResolvedValue([]) },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [() => ENV] }),
        StubCacheModule,
        PrismaModule,
        TaxonomyModule,
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

  it('GET /categories is public', async () => {
    const res = await request(httpServer).get('/api/v1/categories').expect(200);
    expect(res.body).toEqual([{ id: 'c1', name: 'Sciences', slug: 'sciences' }]);
  });

  it('GET /cities is public', async () => {
    const res = await request(httpServer).get('/api/v1/cities').expect(200);
    expect(res.body).toEqual([{ id: 'cty1', name: 'Baku', slug: 'baku' }]);
  });

  it('GET /districts?cityId= forwards the filter', async () => {
    await request(httpServer).get('/api/v1/districts').query({ cityId: 'cty1' }).expect(200);
    expect(prismaMock.district.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { cityId: 'cty1' } }),
    );
  });

  it('POST /admin/taxonomy/categories forbids a non-admin', async () => {
    await request(httpServer)
      .post('/api/v1/admin/taxonomy/categories')
      .set('Authorization', `Bearer ${token('STUDENT')}`)
      .send({ name: 'Arts', slug: 'arts' })
      .expect(403);
  });

  it('POST /admin/taxonomy/categories creates for an admin', async () => {
    const res = await request(httpServer)
      .post('/api/v1/admin/taxonomy/categories')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .send({ name: 'Arts', slug: 'arts' })
      .expect(201);
    expect(res.body).toMatchObject({ slug: 'arts' });
  });

  it('POST /admin/taxonomy/categories rejects an invalid slug with 400', async () => {
    await request(httpServer)
      .post('/api/v1/admin/taxonomy/categories')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .send({ name: 'Bad', slug: 'Not A Slug' })
      .expect(400);
  });
});
