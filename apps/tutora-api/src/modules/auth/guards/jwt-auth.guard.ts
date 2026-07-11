import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedUser, JwtPayload } from '../types/auth.types';

const BEARER_PREFIX = 'Bearer ';

/**
 * Verifies the `Authorization: Bearer <accessToken>` JWT and attaches the
 * decoded principal to `request.user`. Fails closed: any missing, malformed,
 * invalid, or expired token yields a 401. Routes marked `@Public()` are
 * allowed through without a token.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request.headers.authorization);

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      // Never surface verification internals (expiry, signature) to the client.
      throw new UnauthorizedException('Invalid or expired access token');
    }

    request.user = this.toAuthenticatedUser(payload);
    return true;
  }

  private extractBearerToken(header: string | undefined): string {
    if (!header?.startsWith(BEARER_PREFIX)) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = header.slice(BEARER_PREFIX.length).trim();
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }
    return token;
  }

  private toAuthenticatedUser(payload: JwtPayload): AuthenticatedUser {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      onboardingCompleted: payload.onboardingCompleted,
    };
  }
}
