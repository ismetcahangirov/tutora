/**
 * `/` — the routing gate (issue #23).
 *
 * The single source of truth for where a user lands on launch. It waits for the
 * session restore to settle, then redirects by auth state: unauthenticated →
 * onboarding, authenticated-without-a-role → role selection, otherwise → home.
 */
import { Redirect } from 'expo-router';

import { useAuth } from '@features/auth';
import { ScreenLoader } from '@/shared';

export default function Index() {
  const { isRestoringSession, isAuthenticated, user } = useAuth();

  if (isRestoringSession) {
    return <ScreenLoader />;
  }
  if (!isAuthenticated) {
    return <Redirect href="/welcome" />;
  }
  if (!user?.role) {
    return <Redirect href="/role" />;
  }
  return <Redirect href="/home" />;
}
