import { Server } from 'node:http';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule } from '@/prisma/prisma.module';
import { PrismaService } from '@/prisma/prisma.service';
import { SearchModule } from './search.module';

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tp1',
    bio: 'Experienced maths tutor',
    experienceYears: 5,
    hourlyRateCache: 30,
    currency: 'AZN',
    formats: ['ONLINE'],
    verificationStatus: 'VERIFIED',
    ratingAvg: 4.7,
    ratingCount: 12,
    user: { name: 'Ada', avatarUrl: null },
    subjects: [{ subjectId: 's1', subject: { name: 'Maths', slug: 'maths' } }],
    districts: [],
    languages: [],
    ...overrides,
  };
}

describe('Search module (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;

  const prismaMock = {
    tutorProfile: {
      findMany: jest.fn().mockResolvedValue([makeRow()]),
      count: jest.fn().mockResolvedValue(1),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [() => ({})] }),
        PrismaModule,
        SearchModule,
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /search/tutors is public and returns a paginated envelope', async () => {
    const res = await request(httpServer).get('/api/v1/search/tutors').expect(200);
    expect(res.body).toHaveProperty('meta');
    expect(res.body).toMatchObject({ data: [{ id: 'tp1', name: 'Ada' }] });
  });

  it('coerces and applies numeric + relation filters', async () => {
    await request(httpServer)
      .get('/api/v1/search/tutors')
      .query({ minPrice: '20', maxPrice: '40', minRating: '4', subjectId: 's1', format: 'ONLINE' })
      .expect(200);

    expect(prismaMock.tutorProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          verificationStatus: 'VERIFIED',
          isPublished: true,
          deletedAt: null,
          subjects: { some: { subjectId: 's1' } },
          formats: { has: 'ONLINE' },
          hourlyRateCache: { gte: 20, lte: 40 },
          ratingAvg: { gte: 4 },
        },
      }),
    );
  });

  it('rejects an out-of-range rating with 400', async () => {
    await request(httpServer).get('/api/v1/search/tutors').query({ minRating: '9' }).expect(400);
  });

  it('rejects an unknown sort option with 400', async () => {
    await request(httpServer).get('/api/v1/search/tutors').query({ sort: 'sideways' }).expect(400);
  });
});
