import { Server } from 'node:http';
import { Body, Controller, type INestApplication, Post, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsIn } from 'class-validator';
import { i18nValidationErrorFactory, i18nValidationMessage } from 'nestjs-i18n';
import request from 'supertest';
import { createI18nValidationExceptionFilter } from '@common/filters/i18n-validation-exception.filter';
import { AppI18nModule } from '../i18n.module';

class DemoDto {
  @IsIn(['STUDENT', 'TUTOR'], { message: i18nValidationMessage('validation.role.invalid') })
  role!: string;
}

@Controller('demo')
class DemoController {
  @Post()
  create(@Body() dto: DemoDto): { ok: boolean; role: string } {
    return { ok: true, role: dto.role };
  }
}

describe('i18n validation (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppI18nModule],
      controllers: [DemoController],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        exceptionFactory: i18nValidationErrorFactory,
      }),
    );
    app.useGlobalFilters(createI18nValidationExceptionFilter());
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  it('defaults to Azerbaijani and returns the standard error envelope', async () => {
    const res = await request(httpServer).post('/demo').send({ role: 'ADMIN' }).expect(400);
    const body = res.body as {
      statusCode: number;
      error: string;
      message: string;
      path: string;
      timestamp: string;
    };
    expect(body.statusCode).toBe(400);
    expect(body.error).toBe('BadRequest');
    expect(body.message).toBe('Rol yalnız icazə verilən dəyərlərdən biri olmalıdır.');
    expect(body.path).toBe('/demo');
    expect(typeof body.timestamp).toBe('string');
  });

  it('translates the message via the ?lang query resolver', async () => {
    const res = await request(httpServer).post('/demo?lang=ru').send({ role: 'ADMIN' }).expect(400);
    expect((res.body as { message: string }).message).toBe(
      'Роль должна быть одной из допустимых значений.',
    );
  });

  it('translates the message via the Accept-Language header', async () => {
    const res = await request(httpServer)
      .post('/demo')
      .set('Accept-Language', 'en')
      .send({ role: 'ADMIN' })
      .expect(400);
    expect((res.body as { message: string }).message).toBe(
      'Role must be one of the allowed values.',
    );
  });
});
