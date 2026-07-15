import request from 'supertest';
import { bootstrapE2EApp, type E2EApp } from '../utils/e2e-app';

/**
 * Liveness probe end-to-end. Booted through the shared harness (infrastructure
 * mocked) so it runs in CI with no Postgres — the check the old DB-coupled
 * `app.e2e-spec.ts` could never do without a live container.
 */
describe('Health (e2e)', () => {
  let e2e: E2EApp;

  beforeAll(async () => {
    e2e = await bootstrapE2EApp({ prisma: {} });
  });

  afterAll(async () => {
    await e2e.app.close();
  });

  it('GET /api/v1/health reports ok with uptime and a timestamp', async () => {
    const res = await request(e2e.httpServer).get('/api/v1/health').expect(200);

    const body = res.body as { status: string; uptime: number; timestamp: string };
    expect(body.status).toBe('ok');
    expect(typeof body.uptime).toBe('number');
    expect(typeof body.timestamp).toBe('string');
  });
});
