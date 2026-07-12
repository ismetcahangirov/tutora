import { redisConnectionOptions } from './jobs.connection';

describe('redisConnectionOptions', () => {
  it('parses host and port from a plain redis URL', () => {
    expect(redisConnectionOptions('redis://localhost:6379')).toEqual({
      host: 'localhost',
      port: 6379,
    });
  });

  it('defaults the port to 6379 when the URL omits it', () => {
    expect(redisConnectionOptions('redis://cache.internal')).toMatchObject({
      host: 'cache.internal',
      port: 6379,
    });
  });

  it('extracts username, password and database index', () => {
    expect(redisConnectionOptions('redis://user:p%40ss@10.0.0.1:6380/3')).toEqual({
      host: '10.0.0.1',
      port: 6380,
      username: 'user',
      password: 'p@ss',
      db: 3,
    });
  });

  it('enables TLS for a rediss:// URL', () => {
    expect(redisConnectionOptions('rediss://secure.host:6379')).toMatchObject({ tls: {} });
  });

  it('omits optional fields when absent', () => {
    const options = redisConnectionOptions('redis://localhost:6379');
    expect(options).not.toHaveProperty('password');
    expect(options).not.toHaveProperty('db');
    expect(options).not.toHaveProperty('tls');
  });
});
