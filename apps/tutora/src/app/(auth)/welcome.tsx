/**
 * `/welcome` — first-run onboarding entry (issues #23, #41).
 *
 * Shows the intro carousel + Google sign-in to signed-out users. Once signed in,
 * the landing decision forwards them onward: to role selection if they have no
 * role yet, otherwise into their role's home.
 */
import { Redirect } from 'expo-router';

import { useAuth } from '@features/auth';
import { WelcomeScreen } from '@features/onboarding';
import { resolveLandingRoute } from '@/shared';

export default function WelcomeRoute() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return <Redirect href={resolveLandingRoute({ isAuthenticated, role: user?.role })} />;
  }
  return <WelcomeScreen />;
}
