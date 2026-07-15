import { Server } from 'node:http';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import type { UserRole } from '@prisma/client';
import { i18nValidationErrorFactory } from 'nestjs-i18n';
import { AppI18nModule } from '@/i18n/i18n.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { PrismaService } from '@/prisma/prisma.service';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';
import { createI18nValidationExceptionFilter } from '@common/filters/i18n-validation-exception.filter';
import { ApplicationsModule } from '@modules/applications/applications.module';
import { AuthModule } from '@modules/auth/auth.module';
import { GoogleVerifierService } from '@modules/auth/services/google-verifier.service';
import { BillingModule } from '@modules/billing/billing.module';
import { HealthModule } from '@modules/health/health.module';
import { SearchModule } from '@modules/search/search.module';
import { UsersModule } from '@modules/users/users.module';

/**
 * Test secrets for the E2E app. These are the only env keys the critical-path
 * modules read (JWT + Google client id); everything else (Redis, BullMQ, mail,
 * storage) is left out of the module graph so the suite runs with zero external
 * services — exactly like the per-module integration specs, but composed into a
 * single app so one real token can authorize across module boundaries.
 */
export const ENV = {
  JWT_ACCESS_SECRET: 'access-secret-for-e2e',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'refresh-secret-for-e2e',
  JWT_REFRESH_EXPIRES_IN: '7d',
  GOOGLE_CLIENT_ID: 'client-id',
} as const;

/** A minimal Google verifier double; override `verify` per test as needed. */
export interface VerifierDouble {
  verify: jest.Mock;
}

export interface E2EApp {
  app: INestApplication;
  httpServer: Server;
  jwt: JwtService;
}

export interface BootstrapOptions {
  /** Prisma double backing every module in the app (per-method or stateful). */
  prisma: object;
  /** Optional Google verifier double; defaults to an unconfigured mock. */
  verifier?: VerifierDouble;
}

/**
 * Boots the critical-path modules (auth, users, search, applications, billing,
 * health) as one Nest app configured byte-for-byte like `main.ts`: the `api`
 * prefix, URI versioning, the whitelisting `ValidationPipe` wired to the i18n
 * error factory, and the two global filters in their required order. The only
 * substitutions are the infrastructure boundaries — `PrismaService` and the
 * Google verifier — so the HTTP surface, DI graph, guards and validation are
 * the real thing.
 */
export async function bootstrapE2EApp({ prisma, verifier }: BootstrapOptions): Promise<E2EApp> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, load: [() => ENV] }),
      AppI18nModule,
      PrismaModule,
      AuthModule,
      UsersModule,
      SearchModule,
      ApplicationsModule,
      BillingModule,
      HealthModule,
    ],
  })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .overrideProvider(GoogleVerifierService)
    .useValue(verifier ?? { verify: jest.fn() })
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: i18nValidationErrorFactory,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter(), createI18nValidationExceptionFilter());
  await app.init();

  return {
    app,
    httpServer: app.getHttpServer() as Server,
    jwt: app.get(JwtService),
  };
}

/** The principal fields an access-token subject carries. */
export interface Principal {
  sub: string;
  email?: string;
  role: UserRole | null;
  onboardingCompleted?: boolean;
}

/**
 * Mints an access token exactly as `TokenService` does, so it verifies against
 * the app's real `JwtAuthGuard`. Use this to represent an already-onboarded
 * principal without walking the full sign-in flow.
 */
export function signAccessToken(jwt: JwtService, principal: Principal): string {
  return jwt.sign(
    {
      sub: principal.sub,
      email: principal.email ?? 'user@example.com',
      role: principal.role,
      onboardingCompleted: principal.onboardingCompleted ?? true,
    },
    { secret: ENV.JWT_ACCESS_SECRET, expiresIn: ENV.JWT_ACCESS_EXPIRES_IN },
  );
}
