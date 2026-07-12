import { Server } from 'node:http';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule } from '@/prisma/prisma.module';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthModule } from '@modules/auth/auth.module';
import { AdminJobsController } from './admin-jobs.controller';
import { JobsService } from './jobs.service';
import { MaintenanceJob } from './jobs.types';

const ENV = {
  JWT_ACCESS_SECRET: 'access-secret-for-tests',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'refresh-secret-for-tests',
  JWT_REFRESH_EXPIRES_IN: '7d',
  GOOGLE_CLIENT_ID: 'client-id',
};

// The controller is wired directly against a mocked JobsService so the queue —
// and its Redis connection — never enter the test (the real JobsModule would).
describe('Admin jobs (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let jwt: JwtService;

  const jobsMock = {
    listSchedules: jest
      .fn()
      .mockReturnValue([{ job: MaintenanceJob.Cleanup, pattern: '15 3 * * *' }]),
    enqueue: jest.fn().mockResolvedValue({ id: 'job-1', job: MaintenanceJob.Cleanup }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [() => ENV] }),
        PrismaModule,
        AuthModule,
      ],
      controllers: [AdminJobsController],
      providers: [{ provide: JobsService, useValue: jobsMock }],
    })
      .overrideProvider(PrismaService)
      .useValue({})
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
      { sub: 'u1', email: 'admin@example.com', role, onboardingCompleted: true },
      { secret: ENV.JWT_ACCESS_SECRET, expiresIn: '15m' },
    );
  }

  it('rejects an unauthenticated request', async () => {
    await request(httpServer).get('/api/v1/admin/jobs').expect(401);
  });

  it('forbids a non-admin caller', async () => {
    await request(httpServer)
      .post('/api/v1/admin/jobs/cleanup/run')
      .set('Authorization', `Bearer ${token('STUDENT')}`)
      .expect(403);
  });

  it('lists the configured schedules for an admin', async () => {
    const res = await request(httpServer)
      .get('/api/v1/admin/jobs')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .expect(200);

    expect(res.body).toEqual([{ job: 'cleanup', pattern: '15 3 * * *' }]);
  });

  it('enqueues a job on demand for an admin (202)', async () => {
    const res = await request(httpServer)
      .post('/api/v1/admin/jobs/cleanup/run')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .expect(202);

    expect(res.body).toEqual({ id: 'job-1', job: 'cleanup' });
    expect(jobsMock.enqueue).toHaveBeenCalledWith(MaintenanceJob.Cleanup);
  });

  it('rejects an unknown job name with 400', async () => {
    await request(httpServer)
      .post('/api/v1/admin/jobs/mystery/run')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .expect(400);
  });
});
