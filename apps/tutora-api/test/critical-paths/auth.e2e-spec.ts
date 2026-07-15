import request from 'supertest';
import { bootstrapE2EApp, ENV, type E2EApp } from '../utils/e2e-app';
import { createStatefulAuthPrisma } from '../utils/stateful-auth-prisma';

/**
 * End-to-end auth lifecycle (#96, #99) against a stateful backing store: the
 * refresh tokens the API issues are fed straight back into `/auth/refresh`, so
 * rotation and reuse-detection are exercised through the real HTTP surface —
 * not simulated with canned per-call responses like the module integration
 * spec. Also proves onboarding propagates into a freshly minted access token.
 */
describe('Auth lifecycle (e2e)', () => {
  let e2e: E2EApp;
  const verifier = {
    verify: jest.fn().mockResolvedValue({
      googleId: 'g-ada',
      email: 'ada@example.com',
      emailVerified: true,
      name: 'Ada Lovelace',
      picture: null,
      locale: 'az',
    }),
  };

  beforeAll(async () => {
    e2e = await bootstrapE2EApp({ prisma: createStatefulAuthPrisma(), verifier });
  });

  afterAll(async () => {
    await e2e.app.close();
  });

  // Shared across the ordered steps below — a single user's session lifecycle.
  let access1 = '';
  let refresh1 = '';
  let refresh2 = '';

  it('signs a new user in with Google: 200, tokens, and no role yet', async () => {
    const res = await request(e2e.httpServer)
      .post('/api/v1/auth/google')
      .send({ idToken: 'valid-google-token' })
      .expect(200);

    const body = res.body as {
      accessToken: string;
      refreshToken: string;
      user: { email: string; role: string | null; onboardingCompleted: boolean };
    };
    expect(typeof body.accessToken).toBe('string');
    expect(typeof body.refreshToken).toBe('string');
    expect(body.user).toMatchObject({
      email: 'ada@example.com',
      role: null,
      onboardingCompleted: false,
    });

    access1 = body.accessToken;
    refresh1 = body.refreshToken;
  });

  it('rejects an unauthenticated GET /users/me with 401', async () => {
    await request(e2e.httpServer).get('/api/v1/users/me').expect(401);
  });

  it('rejects a malformed bearer token with 401', async () => {
    await request(e2e.httpServer)
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401);
  });

  it('returns the signed-in profile from GET /users/me', async () => {
    const res = await request(e2e.httpServer)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${access1}`)
      .expect(200);

    expect(res.body).toMatchObject({ email: 'ada@example.com', role: null });
  });

  it('completes onboarding via PATCH /users/me { role: STUDENT }', async () => {
    const res = await request(e2e.httpServer)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${access1}`)
      .send({ role: 'STUDENT' })
      .expect(200);

    expect(res.body).toMatchObject({ role: 'STUDENT', onboardingCompleted: true });
  });

  it('rejects a non-selectable role (ADMIN) with 400', async () => {
    await request(e2e.httpServer)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${access1}`)
      .send({ role: 'ADMIN' })
      .expect(400);
  });

  it('rotates the refresh token and mints an access token carrying the new role', async () => {
    const res = await request(e2e.httpServer)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: refresh1 })
      .expect(200);

    const body = res.body as { accessToken: string; refreshToken: string };
    expect(typeof body.accessToken).toBe('string');
    expect(body.refreshToken).not.toBe(refresh1);

    // The rotated access token reflects the role set during onboarding.
    const payload = e2e.jwt.verify<{ role: string | null; onboardingCompleted: boolean }>(
      body.accessToken,
      { secret: ENV.JWT_ACCESS_SECRET },
    );
    expect(payload).toMatchObject({ role: 'STUDENT', onboardingCompleted: true });

    refresh2 = body.refreshToken;
  });

  it('detects reuse of the rotated-out token: 401', async () => {
    await request(e2e.httpServer)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: refresh1 })
      .expect(401);
  });

  it('bulk-revokes the family on reuse, so the live token is now dead too: 401', async () => {
    await request(e2e.httpServer)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: refresh2 })
      .expect(401);
  });

  it('returns 401 for an unknown refresh token without leaking existence', async () => {
    await request(e2e.httpServer)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'never-issued' })
      .expect(401);
  });

  it('logs out: a signed-in session cannot refresh after logout', async () => {
    const signIn = await request(e2e.httpServer)
      .post('/api/v1/auth/google')
      .send({ idToken: 'valid-google-token' })
      .expect(200);
    const { refreshToken } = signIn.body as { refreshToken: string };

    await request(e2e.httpServer).post('/api/v1/auth/logout').send({ refreshToken }).expect(204);

    await request(e2e.httpServer).post('/api/v1/auth/refresh').send({ refreshToken }).expect(401);
  });
});
