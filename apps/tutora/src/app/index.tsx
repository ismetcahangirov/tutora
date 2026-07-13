/**
 * `/` — the routing gate (issues #23, #41).
 *
 * The single source of truth for where a user lands on launch. It waits for the
 * session restore to settle, then delegates the destination to
 * `resolveLandingRoute` — the same decision every route-group layout uses, so
 * onboarding, the student tab shell, and the tutor experience stay in sync.
 */
import { Redirect } from 'expo-router';

import { useAuth } from '@features/auth';
import { ScreenLoader, resolveLandingRoute } from '@/shared';

export default function Index() {
  const { isRestoringSession, isAuthenticated, user } = useAuth();

  if (isRestoringSession) {
    return <ScreenLoader />;
  }
  return <Redirect href={resolveLandingRoute({ isAuthenticated, role: user?.role })} />;
}
