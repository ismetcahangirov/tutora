/**
 * GoogleSignInButton — the reusable "Continue with Google" action (issue #22, #23).
 *
 * Wraps the CTA, its in-flight state, and the inline error/retry so both the
 * sign-in screen and the onboarding welcome screen share one implementation.
 * Purely presentational: all orchestration lives in `useGoogleSignIn`.
 */
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, ErrorState, Text } from '@/components/ui';
import { spacing } from '@/theme';

import { useGoogleSignIn } from '../hooks/useGoogleSignIn';

export function GoogleSignInButton() {
  const { isSigningIn, error, signInWithGoogle } = useGoogleSignIn();
  const { t } = useTranslation();
  const continueLabel = t('auth.screen.continueWithGoogle');

  return (
    <View style={styles.container}>
      {error ? (
        <ErrorState
          title={t('auth.error.title')}
          description={error}
          retryLabel={t('auth.error.retry')}
          onRetry={signInWithGoogle}
        />
      ) : null}

      <Button
        testID="google-signin-button"
        label={continueLabel}
        size="large"
        fullWidth
        loading={isSigningIn}
        onPress={signInWithGoogle}
        accessibilityLabel={continueLabel}
      />
      <Text variant="caption" color="muted" align="center">
        {t('auth.screen.legal')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
});
