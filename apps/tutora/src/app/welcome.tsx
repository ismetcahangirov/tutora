/**
 * `/welcome` — first-run onboarding entry (issue #23).
 *
 * Shows the intro carousel + Google sign-in to unauthenticated users. Once
 * signed in, the user has no role yet, so we move them to role selection.
 */
import { Redirect } from 'expo-router';

import { useAuth } from '@features/auth';
import { WelcomeScreen } from '@features/onboarding';

export default function WelcomeRoute() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return <Redirect href={user?.role ? '/home' : '/role'} />;
  }
  return <WelcomeScreen />;
}
