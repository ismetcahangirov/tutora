// Must be imported first: initializes Sentry before any other module loads so
// its auto-instrumentation can patch dependencies at require time (#92).
import './instrument';

import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { i18nValidationErrorFactory } from 'nestjs-i18n';
import { AppModule } from './app.module';
import { appConfig } from '@config/app.config';
import { createI18nValidationExceptionFilter } from '@common/filters/i18n-validation-exception.filter';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';
import { setupSwagger } from './swagger';

// Kept in sync with apps/tutora-api/package.json "version".
const API_VERSION = '0.0.1';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });

  // CORS: let the browser frontends (web landing + admin panel) call the API.
  // Exact origins come from CORS_ORIGINS (comma-separated); with none configured
  // we reflect the request origin so first-boot works before the deployed URLs
  // are known. `credentials` is on for cookie-based admin/web sessions.
  const corsOrigins = process.env.CORS_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins && corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: i18nValidationErrorFactory,
    }),
  );
  // Order matters: Nest applies global filters in REVERSE registration order, so
  // the catch-all must be registered FIRST and the specific i18n validation filter
  // LAST — otherwise the catch-all shadows it and validation errors lose their
  // localized message. Guarded by filter-order.integration.spec.ts.
  app.useGlobalFilters(new AllExceptionsFilter(), createI18nValidationExceptionFilter());

  setupSwagger(app, API_VERSION);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`${appConfig.name} running on port ${port}`, 'Bootstrap');
  Logger.log(`Swagger docs at http://localhost:${port}/docs`, 'Bootstrap');
}
void bootstrap();
