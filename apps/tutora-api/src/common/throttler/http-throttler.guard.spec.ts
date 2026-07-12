import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { HttpThrottlerGuard } from './http-throttler.guard';

const OPTIONS: ThrottlerModuleOptions = {
  throttlers: [{ name: 'default', ttl: 60_000, limit: 5 }],
  setHeaders: true,
};

function buildContext(type: 'http' | 'ws'): ExecutionContext {
  const req = { ip: '127.0.0.1', headers: {} };
  const res = { header: jest.fn() };
  return {
    getType: () => type,
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
  } as unknown as ExecutionContext;
}

async function buildGuard(storage: ThrottlerStorage): Promise<HttpThrottlerGuard> {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(undefined),
  } as unknown as Reflector;
  const guard = new HttpThrottlerGuard(OPTIONS, storage, reflector);
  await guard.onModuleInit();
  return guard;
}

describe('HttpThrottlerGuard', () => {
  it('skips a WebSocket context without consuming the limiter', async () => {
    const increment = jest.fn();

    const guard = await buildGuard({ increment });
    await expect(guard.canActivate(buildContext('ws'))).resolves.toBe(true);
    expect(increment).not.toHaveBeenCalled();
  });

  it('rate-limits an HTTP context (consults the limiter)', async () => {
    const increment = jest.fn().mockResolvedValue({
      totalHits: 1,
      timeToExpire: 60,
      isBlocked: false,
      timeToBlockExpire: 0,
    });

    const guard = await buildGuard({ increment });
    await expect(guard.canActivate(buildContext('http'))).resolves.toBe(true);
    expect(increment).toHaveBeenCalledTimes(1);
  });
});
