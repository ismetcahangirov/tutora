import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { UserRole } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import type { AuthenticatedUser } from '../types/auth.types';

function build(requiredRoles: UserRole[] | undefined, user?: Partial<AuthenticatedUser>) {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(requiredRoles) };
  const guard = new RolesGuard(reflector as unknown as Reflector);
  const request = { user } as Partial<Request>;
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
  return { guard, context };
}

describe('RolesGuard', () => {
  it('allows the request when no @Roles metadata is present', () => {
    const { guard, context } = build(undefined, { id: 'u1', role: 'STUDENT' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows the request when @Roles is an empty array', () => {
    const { guard, context } = build([], { id: 'u1', role: 'STUDENT' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows the request when the user role is in the allowed set', () => {
    const { guard, context } = build(['ADMIN', 'TUTOR'], { id: 'u1', role: 'TUTOR' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects the request when the user role is not allowed (403)', () => {
    const { guard, context } = build(['ADMIN'], { id: 'u1', role: 'STUDENT' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('fails closed with 403 when roles are required but no user is present', () => {
    const { guard, context } = build(['ADMIN'], undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('fails closed with 403 when the user has no role (null)', () => {
    const { guard, context } = build(['STUDENT'], { id: 'u1', role: null });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
