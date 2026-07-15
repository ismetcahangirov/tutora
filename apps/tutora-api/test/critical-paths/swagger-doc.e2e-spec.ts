import { SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
import { buildSwaggerConfig } from '@/swagger';
import { bootstrapE2EApp, type E2EApp } from '../utils/e2e-app';
import { createStatefulAuthPrisma } from '../utils/stateful-auth-prisma';

/** Minimal typed view over the parts of an operation this suite asserts on. */
interface JsonSchemaLike {
  $ref?: string;
  properties?: {
    data?: { items?: { $ref?: string } };
    meta?: { $ref?: string };
  };
}
interface OperationLike {
  security?: Array<Record<string, string[]>>;
  responses: Record<string, { content?: Record<string, { schema?: JsonSchemaLike }> }>;
}

/** Extracts the `application/json` schema documented for `status` on an operation. */
function jsonSchema(op: OperationLike | undefined, status: string): JsonSchemaLike | undefined {
  return op?.responses[status]?.content?.['application/json']?.schema;
}

/**
 * Generates the OpenAPI document against the composed critical-path app (auth,
 * users, search, applications, billing, health) and asserts the shared Swagger
 * primitives resolve at runtime. Typecheck cannot catch a broken `$ref`, an enum
 * name collision, or a malformed response decorator — those only surface when
 * `SwaggerModule.createDocument` walks the metadata, which is what this proves.
 */
describe('OpenAPI document (e2e)', () => {
  let e2e: E2EApp;
  let document: OpenAPIObject;

  // No endpoint is exercised here — the document is built purely from route
  // metadata — but bootstrapping the module graph still needs a Prisma double.
  beforeAll(async () => {
    e2e = await bootstrapE2EApp({ prisma: createStatefulAuthPrisma() });
    document = SwaggerModule.createDocument(e2e.app, buildSwaggerConfig('0.0.1'));
  }, 30000);

  afterAll(async () => {
    await e2e?.app.close();
  });

  it('generates paths for the composed modules', () => {
    expect(Object.keys(document.paths).length).toBeGreaterThan(0);
    expect(document.paths['/api/v1/auth/google']).toBeDefined();
    expect(document.paths['/api/v1/applications']).toBeDefined();
  });

  it('registers the shared component schemas', () => {
    const schemas = document.components?.schemas ?? {};
    expect(schemas['ApiErrorDto']).toBeDefined();
    expect(schemas['PageMetaDto']).toBeDefined();
    expect(schemas['ApplicationViewDto']).toBeDefined();
  });

  it('documents the paginated list envelope with $ref-ed data and meta', () => {
    const list = document.paths['/api/v1/applications']?.get as unknown as OperationLike;
    const schema = jsonSchema(list, '200');
    expect(schema?.properties?.data?.items?.$ref).toContain('ApplicationViewDto');
    expect(schema?.properties?.meta?.$ref).toContain('PageMetaDto');
  });

  it('documents the standard error envelope on a protected endpoint', () => {
    const list = document.paths['/api/v1/applications']?.get as unknown as OperationLike;
    expect(jsonSchema(list, '401')?.$ref).toContain('ApiErrorDto');
  });

  it('marks protected operations with the bearer security requirement', () => {
    const create = document.paths['/api/v1/applications']?.post as unknown as OperationLike;
    expect(create.security).toEqual(expect.arrayContaining([{ bearer: [] }]));
  });
});
