import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns an ok status with a numeric uptime and ISO timestamp', () => {
    const result = new HealthController().check();
    expect(result.status).toBe('ok');
    expect(typeof result.uptime).toBe('number');
    expect(() => new Date(result.timestamp).toISOString()).not.toThrow();
  });
});
