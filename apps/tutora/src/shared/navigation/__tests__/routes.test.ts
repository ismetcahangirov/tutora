/**
 * The auth-driven landing decision (issue #41).
 *
 * This pure function is the single source of truth every route guard shares, so
 * it carries the coverage for the app's navigation rules.
 */
import { ROUTES, resolveLandingRoute } from '../routes';

describe('resolveLandingRoute (#41)', () => {
  it('sends an unauthenticated user to onboarding', () => {
    expect(resolveLandingRoute({ isAuthenticated: false, role: null })).toBe(ROUTES.welcome);
    // A stale role is irrelevant while signed out — auth state wins.
    expect(resolveLandingRoute({ isAuthenticated: false, role: 'STUDENT' })).toBe(ROUTES.welcome);
  });

  it('sends a signed-in user without a role to role selection', () => {
    expect(resolveLandingRoute({ isAuthenticated: true, role: null })).toBe(ROUTES.role);
    expect(resolveLandingRoute({ isAuthenticated: true, role: undefined })).toBe(ROUTES.role);
  });

  it('sends a student to the student tab shell', () => {
    expect(resolveLandingRoute({ isAuthenticated: true, role: 'STUDENT' })).toBe(
      ROUTES.studentHome,
    );
  });

  it('sends a tutor to the tutor experience', () => {
    expect(resolveLandingRoute({ isAuthenticated: true, role: 'TUTOR' })).toBe(ROUTES.tutorHome);
  });

  it('falls back to the student shell for an admin (no mobile surface)', () => {
    expect(resolveLandingRoute({ isAuthenticated: true, role: 'ADMIN' })).toBe(ROUTES.studentHome);
  });
});
