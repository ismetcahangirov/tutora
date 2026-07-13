/**
 * `(auth)` route group — the pre-app onboarding & authentication flow (issue #41).
 *
 * A headerless stack over `welcome` → `sign-in` → `role`. Access is guarded
 * per-screen (each has a different rule: welcome/sign-in are for signed-out
 * users, role is for a signed-in user without a role), so the group layout only
 * owns the navigator. The group name is invisible in the URL, so these screens
 * keep their flat paths (`/welcome`, `/sign-in`, `/role`).
 */
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
