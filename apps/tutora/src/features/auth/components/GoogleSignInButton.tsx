/**
 * GoogleSignInButton — the reusable "Continue with Google" action (issue #22, #23).
 *
 * Wraps the CTA, its in-flight state, and the inline error/retry so both the
 * sign-in screen and the onboarding welcome screen share one implementation.
 * Purely presentational: all orchestration lives in `useGoogleSignIn`.
 */
import { StyleSheet, View } from 'react-native';

import { Button, ErrorState, Text } from '@/components/ui';
import { spacing } from '@/theme';

import { AUTH_COPY } from '../constants';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';

export function GoogleSignInButton() {
  const { isSigningIn, error, signInWithGoogle } = useGoogleSignIn();

  return (
    <View style={styles.container}>
      {error ? (
        <ErrorState
          title={AUTH_COPY.error.title}
          description={error}
          retryLabel={AUTH_COPY.error.retry}
          onRetry={signInWithGoogle}
        />
      ) : null}

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
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
});
