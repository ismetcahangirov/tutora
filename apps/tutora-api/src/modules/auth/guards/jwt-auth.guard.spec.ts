import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { JwtPayload } from '../types/auth.types';

const VALID_PAYLOAD: JwtPayload = {
  sub: 'user-1',
  email: 'ada@example.com',
  role: 'STUDENT',
  onboardingCompleted: true,
};

interface Mocks {
  guard: JwtAuthGuard;
  jwt: { verifyAsync: jest.Mock };
  reflector: { getAllAndOverride: jest.Mock };
  request: Partial<Request>;
}

function build(headerValue?: string, isPublic = false): Mocks {
  const jwt = { verifyAsync: jest.fn().mockResolvedValue(VALID_PAYLOAD) };
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(isPublic) };
  const config = { getOrThrow: jest.fn().mockReturnValue('access-secret') };
  const guard = new JwtAuthGuard(
    jwt as unknown as JwtService,
    reflector as unknown as Reflector,
    config as unknown as ConfigService,
  );
  const request: Partial<Request> = {
    headers: headerValue ? { authorization: headerValue } : {},
  };
  return { guard, jwt, reflector, request };
}

function contextFor(request: Partial<Request>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  it('allows a request with a valid Bearer token and attaches the principal', async () => {
    const { guard, jwt, request } = build('Bearer valid.token.here');

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(jwt.verifyAsync).toHaveBeenCalledWith('valid.token.here', { secret: 'access-secret' });
    expect(request.user).toEqual({
      id: 'user-1',
      email: 'ada@example.com',
      role: 'STUDENT',
      onboardingCompleted: true,
    });
  });

  it('rejects a request with no Authorization header (401)', async () => {
    const { guard, request } = build(undefined);
    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(request.user).toBeUndefined();
  });

  it('rejects a non-Bearer Authorization scheme (401)', async () => {
    const { guard, request } = build('Basic dXNlcjpwYXNz');
    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an invalid or expired token (401)', async () => {
    const { guard, jwt, request } = build('Bearer bad.token');
    jwt.verifyAsync.mockRejectedValueOnce(new Error('jwt expired'));

    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(request.user).toBeUndefined();
  });

  it('allows a @Public() route without any token and does not verify', async () => {
    const { guard, jwt, request } = build(undefined, true);

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(jwt.verifyAsync).not.toHaveBeenCalled();
  });
});
