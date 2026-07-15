import { BEARER_AUTH_NAME, buildSwaggerConfig } from './swagger';

describe('buildSwaggerConfig', () => {
  it('sets the Tutora API title and the given version', () => {
    const config = buildSwaggerConfig('1.2.3');
    expect(config.info.title).toBe('Tutora API');
    expect(config.info.version).toBe('1.2.3');
  });

  it('registers a bearer auth security scheme named "bearer"', () => {
    const config = buildSwaggerConfig('0.0.1');
    expect(config.components?.securitySchemes?.[BEARER_AUTH_NAME]).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
  });

  it('documents contact details for API consumers', () => {
    const config = buildSwaggerConfig('0.0.1');
    expect(config.info.contact).toMatchObject({ name: 'Tutora Engineering' });
  });

  it('registers described tags for the auth and admin surfaces', () => {
    const config = buildSwaggerConfig('0.0.1');
    const tags = config.tags ?? [];
    const names = tags.map((tag) => tag.name);
    expect(names).toEqual(expect.arrayContaining(['auth', 'admin: users']));
    expect(tags.every((tag) => (tag.description ?? '').length > 0)).toBe(true);
  });
});
