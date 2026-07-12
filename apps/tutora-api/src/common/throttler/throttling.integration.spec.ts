import { Server } from 'node:http';
import { Controller, Get, INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { seconds, SkipThrottle, Throttle, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { HttpThrottlerGuard } from './http-throttler.guard';

const GLOBAL_LIMIT = 3;
const STRICT_LIMIT = 2;

@Controller('t')
class ProbeController {
  @Get('open')
  open(): { ok: true } {
    return { ok: true };
  }

  @Throttle({ default: { limit: STRICT_LIMIT, ttl: seconds(60) } })
  @Get('strict')
  strict(): { ok: true } {
    return { ok: true };
  }

  @SkipThrottle()
  @Get('skip')
  skip(): { ok: true } {
    return { ok: true };
  }
}

// Exercises the real ThrottlerGuard + decorators end-to-end. Uses the in-memory
// storage (no Redis) so the assertions are deterministic; the production wiring
// swaps in Redis storage, which does not change the guard's behaviour.
describe('Rate limiting (integration)', () => {
  let app: INestApplication;
  let httpServer: Server;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{ name: 'default', ttl: seconds(60), limit: GLOBAL_LIMIT }]),
      ],
      controllers: [ProbeController],
      providers: [{ provide: APP_GUARD, useClass: HttpThrottlerGuard }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows requests up to the global limit, then returns 429', async () => {
    for (let i = 0; i < GLOBAL_LIMIT; i += 1) {
      await request(httpServer).get('/t/open').expect(200);
    }
    await request(httpServer).get('/t/open').expect(429);
  });

  it('enforces a tighter per-route budget set with @Throttle', async () => {
    for (let i = 0; i < STRICT_LIMIT; i += 1) {
      await request(httpServer).get('/t/strict').expect(200);
    }
    await request(httpServer).get('/t/strict').expect(429);
  });

  it('never throttles a route marked @SkipThrottle', async () => {
    for (let i = 0; i < GLOBAL_LIMIT + 2; i += 1) {
      await request(httpServer).get('/t/skip').expect(200);
    }
  });
});
