/**
 * App route map + the auth-driven landing decision (issue #41).
 *
 * `ROUTES` is the single source of truth for the top-level paths the app
 * redirects between, so no screen hardcodes a path string. `resolveLandingRoute`
 * is the one place that maps auth state → destination; the routing gate and each
 * route-group layout call it so the navigation rules never drift apart.
 *
 * Route groups (`(auth)`, `(student)`, `(tutor)`) are invisible in the URL, so
 * these paths stay flat and stable regardless of how screens are grouped on disk.
 */
import type { UserRole } from '@features/auth';

export const ROUTES = {
  /** First-run onboarding carousel + Google sign-in. */
  welcome: '/welcome',
  /** Directly-reachable sign-in (re-authentication). */
  signIn: '/sign-in',
  /** Student / Tutor choice for a signed-in user without a role. */
  role: '/role',
  /** Student tab shell entry (Home tab). */
  studentHome: '/home',
  /** Tutor experience entry. */
  tutorHome: '/dashboard',
} as const;

/** Any top-level path the app redirects to. */
export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/** The auth signals the landing decision depends on. */
export type LandingState = {
  isAuthenticated: boolean;
  role: UserRole | null | undefined;
};

/**
 * Where a user belongs given their auth state. Ordered by precedence:
 * unauthenticated → onboarding, signed-in-without-a-role → role selection, then
 * by role. ADMIN has no mobile surface, so it falls through to the student shell
 * (a harmless default — admins use the web panel, not the app).
 */
export function resolveLandingRoute({ isAuthenticated, role }: LandingState): AppRoute {
  if (!isAuthenticated) {
    return ROUTES.welcome;
  }
  if (!role) {
    return ROUTES.role;
  }
  return role === 'TUTOR' ? ROUTES.tutorHome : ROUTES.studentHome;
}
