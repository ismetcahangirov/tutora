import { Server } from 'node:http';
import { Body, Controller, type INestApplication, Post, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsIn } from 'class-validator';
import { i18nValidationErrorFactory, i18nValidationMessage } from 'nestjs-i18n';
import request from 'supertest';
import { AppI18nModule } from '@/i18n/i18n.module';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { createI18nValidationExceptionFilter } from './i18n-validation-exception.filter';

// Regression guard for the global exception-filter ordering wired in `main.ts`.
// Both the specific i18n validation filter AND the catch-all AllExceptionsFilter
// are registered together — exactly as bootstrap does — to prove the i18n filter
// still owns (and localizes) DTO validation errors instead of being shadowed by
// the catch-all. This is the case the per-module integration specs do NOT cover.

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

describe('global exception filter order (integration)', () => {
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
    // MUST mirror the exact registration in src/main.ts.
    app.useGlobalFilters(new AllExceptionsFilter(), createI18nValidationExceptionFilter());
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  it('keeps validation errors localized (i18n filter is not shadowed by the catch-all)', async () => {
    const res = await request(httpServer).post('/demo?lang=ru').send({ role: 'ADMIN' }).expect(400);
    const body = res.body as { statusCode: number; error: string; message: string };
    expect(body.error).toBe('BadRequest');
    expect(body.message).toBe('Роль должна быть одной из допустимых значений.');
  });

  it('still shapes a non-validation HttpException into the standard envelope', async () => {
    // An unknown route produces a 404 NotFoundException, which only the catch-all handles.
    const res = await request(httpServer).get('/does-not-exist').expect(404);
    const body = res.body as { statusCode: number; error: string; path: string };
    expect(body.statusCode).toBe(404);
    expect(body.error).toBe('NotFound');
    expect(body.path).toBe('/does-not-exist');
  });
});
