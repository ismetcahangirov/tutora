/**
 * SignInScreen — the "Continue with Google" entry point (issue #22).
 *
 * Purely presentational: a hero plus the shared `GoogleSignInButton`, which owns
 * the loading / error / idle states. No business logic lives here.
 */
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { spacing, useColors } from '@/theme';

import { GoogleSignInButton } from './GoogleSignInButton';

export function SignInScreen() {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text variant="display" align="center">
            {t('auth.screen.title')}
          </Text>
          <Text variant="body" color="textSecondary" align="center">
            {t('auth.screen.subtitle')}
          </Text>
        </View>
      </View>

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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing['3xl'],
  },
  hero: {
    gap: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
});
