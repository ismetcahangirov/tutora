/**
 * `/role` — Student / Tutor selection (issues #23, #41).
 *
 * Reachable only by a signed-in user who has not chosen a role. Selecting one
 * updates auth state, and the landing decision then forwards them into their
 * role's home.
 */
import { Redirect } from 'expo-router';

import { useAuth } from '@features/auth';
import { RoleSelectionScreen } from '@features/onboarding';
import { ROUTES, resolveLandingRoute } from '@/shared';

export default function RoleRoute() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href={ROUTES.welcome} />;
  }
  if (user?.role) {
    return <Redirect href={resolveLandingRoute({ isAuthenticated, role: user.role })} />;
  }
  return <RoleSelectionScreen />;
}
