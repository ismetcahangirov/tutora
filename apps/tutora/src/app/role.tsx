/**
 * `/role` — Student / Tutor selection (issue #23).
 *
 * Reachable only by a signed-in user who has not chosen a role. Selecting one
 * updates auth state, and this guard then forwards them to home.
 */
import { Redirect } from 'expo-router';

import { useAuth } from '@features/auth';
import { RoleSelectionScreen } from '@features/onboarding';

export default function RoleRoute() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/welcome" />;
  }
  if (user?.role) {
    return <Redirect href="/home" />;
  }
  return <RoleSelectionScreen />;
}
