/**
 * `(tutor)` route group — the tutor tab shell (tutor epic #51).
 *
 * Guards the whole group in one place, exactly like the student shell: hold on a
 * loader while the session restores, then `resolveLandingRoute` redirects any
 * non-tutor destination away, so every tab underneath can assume an authenticated
 * tutor. Renders the three-tab bottom navigator (Dashboard · Applications ·
 * Profile), themed from design tokens and localized. Tab route names stay distinct
 * from the student group's (`account`, not `profile`) so the flat URLs never clash.
 */
import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName } from '@/components/ui';
import { useAuth } from '@features/auth';
import { ROUTES, ScreenLoader, resolveLandingRoute } from '@/shared';
import { useColors } from '@/theme';

type TutorTab = {
  name: string;
  icon: IconName;
  labelKey: string;
};

const TABS: TutorTab[] = [
  { name: 'dashboard', icon: 'home', labelKey: 'tutor.tabs.dashboard' },
  { name: 'applications', icon: 'inbox', labelKey: 'tutor.tabs.applications' },
  { name: 'account', icon: 'user', labelKey: 'tutor.tabs.profile' },
];

export default function TutorLayout() {
  const { isRestoringSession, isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const colors = useColors();

  if (isRestoringSession) {
    return <ScreenLoader />;
  }

  const landing = resolveLandingRoute({ isAuthenticated, role: user?.role });
  if (landing !== ROUTES.tutorHome) {
    return <Redirect href={landing} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.labelKey),
            tabBarIcon: ({ focused }) => (
              <Icon name={tab.icon} size={24} color={focused ? 'primary' : 'muted'} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
