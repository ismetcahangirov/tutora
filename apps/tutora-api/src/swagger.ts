import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

/** Path (after the global prefix is ignored by Swagger) where the docs UI is served. */
export const SWAGGER_PATH = 'docs';

/** Name of the bearer security scheme; referenced by `@ApiBearerAuth('bearer')`. */
export const BEARER_AUTH_NAME = 'bearer';

/**
 * Long-form description shown at the top of the docs. Documents the cross-cutting
 * conventions (auth, versioning, pagination, errors) so they are stated once
 * rather than repeated on every endpoint.
 */
const API_DESCRIPTION = [
  'REST API powering the Tutora tutor-matching platform.',
  '',
  '### Conventions',
  '- **Base path:** every route is prefixed with `/api` and URI-versioned, e.g. `/api/v1/tutors`.',
  '- **Auth:** protected endpoints expect a `Bearer <accessToken>` header. Obtain tokens via `POST /api/v1/auth/google` and refresh with `POST /api/v1/auth/refresh`.',
  '- **Pagination:** list endpoints accept `page` and `limit` query params and return a `{ data, meta }` envelope.',
  '- **Errors:** failures share a single envelope — `{ statusCode, error, message, path, timestamp }`.',
].join('\n');

/**
 * Tag descriptions, keyed by the tag name used in each controller's `@ApiTags`.
 * Kept alongside the config so the docs group endpoints with meaningful copy.
 */
const TAG_DESCRIPTIONS: ReadonlyArray<readonly [name: string, description: string]> = [
  ['auth', 'Google sign-in, token refresh and logout.'],
  ['health', 'Liveness and readiness probes.'],
  ['users', 'The authenticated user’s own account and profile.'],
  ['students', 'Student profile owned by the current user.'],
  ['tutors', 'Tutor profile, certificates and availability owned by the current user.'],
  ['tutor: applications', 'Applications a tutor has received and can respond to.'],
  ['applications', 'Applications a student has sent to tutors.'],
  ['search', 'Public tutor discovery, filtering and sorting.'],
  ['reviews', 'Reviews a student writes and manages.'],
  ['chat', 'Direct messaging threads between students and tutors.'],
  ['notifications', 'The user’s in-app notification inbox and device registration.'],
  ['billing', 'The current user’s subscription and payment history.'],
  ['plans', 'Publicly listed subscription plans.'],
  ['media', 'Signed upload URLs for user-provided media.'],
  ['taxonomy', 'Public subjects, districts and languages catalog.'],
  ['content', 'Public CMS content (landing, FAQ, blog).'],
  ['translations', 'Public localization catalogs.'],
  ['admin: users', 'Admin management of user accounts.'],
  ['admin: students', 'Admin view of student profiles.'],
  ['admin: tutors', 'Admin tutor management and verification.'],
  ['admin: reviews', 'Admin moderation of reviews.'],
  ['admin: taxonomy', 'Admin management of the subjects/districts/languages catalog.'],
  ['admin: notifications', 'Admin broadcast composer and delivery.'],
  ['admin: billing', 'Admin oversight of subscriptions and transactions.'],
  ['admin: plans', 'Admin management of subscription plans.'],
  ['admin: dashboard', 'Admin dashboard aggregations and analytics.'],
  ['admin: content', 'Admin CMS content authoring.'],
  ['admin: translations', 'Admin translation catalog editor.'],
  ['admin: feature flags', 'Admin feature-flag toggles.'],
  ['admin: system settings', 'Admin system-wide settings.'],
  ['admin: audit logs', 'Admin audit-trail of privileged actions.'],
  ['admin: jobs', 'Admin inspection of background jobs and queues.'],
];

/**
 * Builds the OpenAPI metadata document (everything except `paths`). Kept pure and
 * separate from `setupSwagger` so it can be unit-tested without booting an app.
 */
export function buildSwaggerConfig(version: string): Omit<OpenAPIObject, 'paths'> {
  const builder = new DocumentBuilder()
    .setTitle('Tutora API')
    .setDescription(API_DESCRIPTION)
    .setVersion(version)
    .setContact('Tutora Engineering', 'https://tutora.app', 'engineering@tutora.app')
    .setLicense('UNLICENSED', '')
    .addServer('/', 'Current host')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, BEARER_AUTH_NAME);

  for (const [name, description] of TAG_DESCRIPTIONS) {
    builder.addTag(name, description);
  }

  return builder.build();
}

/** Generates the OpenAPI document from the app and mounts the Swagger UI at `/docs`. */
export function setupSwagger(app: INestApplication, version: string): void {
  const document = SwaggerModule.createDocument(app, buildSwaggerConfig(version));
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    customSiteTitle: 'Tutora API — Docs',
    swaggerOptions: {
      // Keep the entered bearer token across page reloads for a smoother DX.
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
    },
  });
}
