import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { i18nValidationErrorFactory } from 'nestjs-i18n';
import { AppModule } from './app.module';
import { appConfig } from '@config/app.config';
import { createI18nValidationExceptionFilter } from '@common/filters/i18n-validation-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });
  // `exceptionFactory` routes validation errors through nestjs-i18n so DTO
  // messages are translated to the request language; the filter shapes them
  // into the standard error envelope.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: i18nValidationErrorFactory,
    }),
  );
  app.useGlobalFilters(createI18nValidationExceptionFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`${appConfig.name} running on port ${port}`, 'Bootstrap');
}
void bootstrap();
