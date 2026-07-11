/**
 * ScreenLoader — a full-screen, theme-aware loading state (issue #23).
 *
 * Shown while the session is being restored at launch and by route guards while
 * auth state settles, so redirects never flash the wrong screen.
 */
import { StyleSheet, View } from 'react-native';

import { LoadingState } from '@/components/ui';
import { useColors } from '@/theme';

export function ScreenLoader() {
  const colors = useColors();

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <LoadingState />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
