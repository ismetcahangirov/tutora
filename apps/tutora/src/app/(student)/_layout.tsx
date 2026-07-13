/**
 * `(student)` route group — the student tab shell (issue #41).
 *
 * Guards the whole group in one place: while the session restores we hold on a
 * loader, then `resolveLandingRoute` decides whether this user belongs here. Any
 * non-student destination (signed out, no role yet, or a tutor) is redirected to
 * its canonical route, so every tab underneath can assume an authenticated
 * student. Renders the five-tab bottom navigator (Home · Search · Favorites ·
 * Messages · Profile), themed from design tokens and localized.
 */
import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName } from '@/components/ui';
import { useAuth } from '@features/auth';
import { MessagesTabIcon } from '@features/chat';
import { ROUTES, ScreenLoader, resolveLandingRoute } from '@/shared';
import { useColors } from '@/theme';

type StudentTab = {
  name: string;
  icon: IconName;
  labelKey: string;
};

const TABS: StudentTab[] = [
  { name: 'home', icon: 'home', labelKey: 'student.tabs.home' },
  { name: 'search', icon: 'search', labelKey: 'student.tabs.search' },
  { name: 'favorites', icon: 'heart', labelKey: 'student.tabs.favorites' },
  { name: 'messages', icon: 'message-circle', labelKey: 'student.tabs.messages' },
  { name: 'profile', icon: 'user', labelKey: 'student.tabs.profile' },
];

export default function StudentLayout() {
  const { isRestoringSession, isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const colors = useColors();

  if (isRestoringSession) {
    return <ScreenLoader />;
  }

  const landing = resolveLandingRoute({ isAuthenticated, role: user?.role });
  if (landing !== ROUTES.studentHome) {
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
            tabBarIcon: ({ focused }) =>
              tab.name === 'messages' ? (
                <MessagesTabIcon focused={focused} />
              ) : (
                <Icon
                  name={tab.icon}
                  size={24}
                  color={focused ? 'primary' : 'muted'}
                  filled={focused && tab.icon === 'heart'}
                />
              ),
          }}
        />
      ))}
    </Tabs>
  );
}
