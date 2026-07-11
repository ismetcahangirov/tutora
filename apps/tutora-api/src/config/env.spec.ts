import { validateEnv } from '@config/env';

const validEnv = {
  DATABASE_URL: 'postgresql://tutora:tutora@localhost:5432/tutora',
  REDIS_URL: 'redis://localhost:6379',
  JWT_ACCESS_SECRET: 'a-sufficiently-long-access-secret',
  JWT_REFRESH_SECRET: 'a-sufficiently-long-refresh-secret',
  GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com',
};

describe('validateEnv', () => {
  it('accepts a valid environment and applies defaults', () => {
    const env = validateEnv(validEnv);
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.JWT_ACCESS_EXPIRES_IN).toBe('15m');
  });

  it('coerces PORT to a number', () => {
    const env = validateEnv({ ...validEnv, PORT: '8080' });
    expect(env.PORT).toBe(8080);
  });

  it('fails fast when a required variable is missing', () => {
    const withoutDb = {
      REDIS_URL: validEnv.REDIS_URL,
      JWT_ACCESS_SECRET: validEnv.JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET: validEnv.JWT_REFRESH_SECRET,
    };
    expect(() => validateEnv(withoutDb)).toThrow(/DATABASE_URL/);
  });

  it('rejects a too-short JWT secret', () => {
    expect(() => validateEnv({ ...validEnv, JWT_ACCESS_SECRET: 'short' })).toThrow(
      /JWT_ACCESS_SECRET/,
    );
  });

  it('requires GOOGLE_CLIENT_ID', () => {
    const withoutGoogle = {
      DATABASE_URL: validEnv.DATABASE_URL,
      REDIS_URL: validEnv.REDIS_URL,
      JWT_ACCESS_SECRET: validEnv.JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET: validEnv.JWT_REFRESH_SECRET,
    };
    expect(() => validateEnv(withoutGoogle)).toThrow(/GOOGLE_CLIENT_ID/);
  });
});
