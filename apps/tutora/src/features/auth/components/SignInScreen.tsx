/**
 * SignInScreen — the "Continue with Google" entry point (issue #22).
 *
 * Purely presentational: it reads state and actions from `useGoogleSignIn` and
 * renders the loading / error / idle states. No business logic lives here.
 * Navigation after a successful sign-in (onboarding vs. home) is #23's concern.
 */
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ErrorState, Text } from '@/components/ui';
import { spacing, useColors } from '@/theme';

import { AUTH_COPY } from '../constants';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';

export function SignInScreen() {
  const colors = useColors();
  const { isSigningIn, error, signInWithGoogle } = useGoogleSignIn();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text variant="display" align="center">
            {AUTH_COPY.screen.title}
          </Text>
          <Text variant="body" color="textSecondary" align="center">
            {AUTH_COPY.screen.subtitle}
          </Text>
        </View>

        {error ? (
          <ErrorState
            title={AUTH_COPY.error.title}
            description={error}
            retryLabel={AUTH_COPY.error.retry}
            onRetry={signInWithGoogle}
          />
        ) : null}
      </View>

      <View style={styles.footer}>
        <Button
          label={AUTH_COPY.screen.continueWithGoogle}
          size="large"
          fullWidth
          loading={isSigningIn}
          onPress={signInWithGoogle}
          accessibilityLabel={AUTH_COPY.screen.continueWithGoogle}
        />
        <Text variant="caption" color="muted" align="center">
          {AUTH_COPY.screen.legal}
        </Text>
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
