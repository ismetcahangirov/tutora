/**
 * WelcomeScreen — first-run entry for unauthenticated users (issue #23).
 *
 * Composes the intro carousel with the shared Google sign-in CTA. Integrating
 * the first-run slides here (rather than a separate "seen once" screen) avoids a
 * local persistence flag entirely: once signed in, the routing gate never sends
 * the user back to /welcome.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { GoogleSignInButton } from '@features/auth';
import { APP_NAME } from '@/shared';
import { LanguageSwitcher } from '@/shared/i18n';
import { spacing, useColors } from '@/theme';

import { ONBOARDING_SLIDE_KEYS } from '../constants';
import type { OnboardingSlide } from '../types';
import { OnboardingCarousel } from './OnboardingCarousel';

export function WelcomeScreen() {
  const colors = useColors();
  const { t } = useTranslation();

  const slides = useMemo<OnboardingSlide[]>(
    () =>
      ONBOARDING_SLIDE_KEYS.map((key) => ({
        key,
        title: t(`onboarding.slides.${key}.title`),
        description: t(`onboarding.slides.${key}.description`),
      })),
    [t],
  );

  return (
    <SafeAreaView
      testID="welcome-screen"
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <View style={styles.brand}>
        <Text variant="title" color="primary" align="center">
          {APP_NAME}
        </Text>
        <LanguageSwitcher />
      </View>

      <OnboardingCarousel slides={slides} />

      <View style={styles.footer}>
        <GoogleSignInButton />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  brand: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
});
