import { buildSwaggerConfig } from './swagger';

describe('buildSwaggerConfig', () => {
  it('sets the Tutora API title and the given version', () => {
    const config = buildSwaggerConfig('1.2.3');
    expect(config.info.title).toBe('Tutora API');
    expect(config.info.version).toBe('1.2.3');
  });

  it('registers a bearer auth security scheme named "bearer"', () => {
    const config = buildSwaggerConfig('0.0.1');
    expect(config.components?.securitySchemes?.bearer).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
  });
});
