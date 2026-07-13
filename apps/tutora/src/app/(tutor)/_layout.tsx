/**
 * `(tutor)` route group — the tutor experience entry (issue #41).
 *
 * Guards the group the same way the student shell does: hold on a loader while
 * the session restores, then redirect any non-tutor destination to its canonical
 * route. The tutor surface is a separate epic, so this is a headerless stack over
 * a single scaffolded screen for now.
 */
import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@features/auth';
import { ROUTES, ScreenLoader, resolveLandingRoute } from '@/shared';

export default function TutorLayout() {
  const { isRestoringSession, isAuthenticated, user } = useAuth();

  if (isRestoringSession) {
    return <ScreenLoader />;
  }

  const landing = resolveLandingRoute({ isAuthenticated, role: user?.role });
  if (landing !== ROUTES.tutorHome) {
    return <Redirect href={landing} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
