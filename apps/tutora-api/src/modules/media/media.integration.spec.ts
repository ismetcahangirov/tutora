import { Server } from 'node:http';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule } from '@/prisma/prisma.module';
import { PrismaService } from '@/prisma/prisma.service';
import { MediaModule } from './media.module';
import { StorageService } from './storage.service';

const ENV = {
  JWT_ACCESS_SECRET: 'access-secret-for-tests',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'refresh-secret-for-tests',
  JWT_REFRESH_EXPIRES_IN: '7d',
  GOOGLE_CLIENT_ID: 'client-id',
};

describe('Media module (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let jwt: JwtService;

  // AuthModule pulls in UsersModule, whose services inject PrismaService; media
  // itself never touches the DB, so a bare stub satisfies the graph.
  const prismaMock = {};
  const storageMock = {
    isConfigured: true,
    createSignedUploadUrl: jest.fn().mockResolvedValue('https://signed.example/put?sig=abc'),
    publicUrl: jest.fn((key: string) => `https://storage.googleapis.com/bucket/${key}`),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [() => ENV] }),
        PrismaModule,
        MediaModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(StorageService)
      .useValue(storageMock)
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

  it('POST /media/uploads requires authentication', async () => {
    await request(httpServer)
      .post('/api/v1/media/uploads')
      .send({ purpose: 'AVATAR', contentType: 'image/jpeg' })
      .expect(401);
  });

  it('POST /media/uploads returns a signed ticket for an authenticated caller', async () => {
    const res = await request(httpServer)
      .post('/api/v1/media/uploads')
      .set('Authorization', `Bearer ${token('STUDENT')}`)
      .send({ purpose: 'AVATAR', contentType: 'image/jpeg' })
      .expect(201);

    const body = res.body as {
      uploadUrl: string;
      method: string;
      maxBytes: number;
      objectKey: string;
      fileUrl: string;
      headers: Record<string, string>;
    };
    expect(body).toMatchObject({
      uploadUrl: 'https://signed.example/put?sig=abc',
      method: 'PUT',
      maxBytes: 5 * 1024 * 1024,
    });
    expect(body.objectKey).toMatch(/^avatars\/u1\/.+\.jpg$/);
    expect(body.fileUrl).toContain(body.objectKey);
    expect(body.headers['Content-Type']).toBe('image/jpeg');
  });

  it('POST /media/uploads rejects an unknown purpose with 400', async () => {
    await request(httpServer)
      .post('/api/v1/media/uploads')
      .set('Authorization', `Bearer ${token('TUTOR')}`)
      .send({ purpose: 'BANNER', contentType: 'image/jpeg' })
      .expect(400);
  });

  it('POST /media/uploads rejects a content type not allowed for the purpose with 400', async () => {
    await request(httpServer)
      .post('/api/v1/media/uploads')
      .set('Authorization', `Bearer ${token('STUDENT')}`)
      .send({ purpose: 'AVATAR', contentType: 'application/pdf' })
      .expect(400);
  });
});
