/**
 * PlaceholderScreen — a themed, full-screen placeholder for surfaces whose real
 * content ships in a later issue (issue #41).
 *
 * The student tab shell and the tutor entry are scaffolded now; each tab renders
 * this with its own copy so the navigation is real and reviewable while the
 * features are built. Reuses `EmptyState` for the centered icon + copy and adds
 * an optional bottom action (e.g. sign out) plus arbitrary footer content.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, EmptyState, type ButtonVariant, type IconName } from '@/components/ui';
import { spacing, useColors } from '@/theme';

export type PlaceholderScreenAction = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
};

export type PlaceholderScreenProps = {
  icon?: IconName;
  title: string;
  description?: string;
  /** Primary bottom action, rendered as a full-width button. */
  action?: PlaceholderScreenAction;
  /** Extra footer content rendered above the action (e.g. a language switcher). */
  footer?: ReactNode;
  testID?: string;
};

export function PlaceholderScreen({
  icon,
  title,
  description,
  action,
  footer,
  testID,
}: PlaceholderScreenProps) {
  const colors = useColors();

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
      testID={testID}
    >
      <EmptyState icon={icon} title={title} description={description} />
      {footer || action ? (
        <View style={styles.footer}>
          {footer}
          {action ? (
            <Button
              label={action.label}
              variant={action.variant ?? 'primary'}
              onPress={action.onPress}
              fullWidth
            />
          ) : null}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
});
