import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

/** Path (after the global prefix is ignored by Swagger) where the docs UI is served. */
export const SWAGGER_PATH = 'docs';

/**
 * Builds the OpenAPI metadata document (everything except `paths`). Kept pure and
 * separate from `setupSwagger` so it can be unit-tested without booting an app.
 */
export function buildSwaggerConfig(version: string): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle('Tutora API')
    .setDescription('REST API powering the Tutora tutor-matching platform.')
    .setVersion(version)
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .build();
}

/** Generates the OpenAPI document from the app and mounts the Swagger UI at `/docs`. */
export function setupSwagger(app: INestApplication, version: string): void {
  const document = SwaggerModule.createDocument(app, buildSwaggerConfig(version));
  SwaggerModule.setup(SWAGGER_PATH, app, document);
}
