/**
 * DateSeparator — a centered day label between message groups (#47).
 *
 * Rendered above the first message of each calendar day so a long thread stays
 * legible. Purely presentational; the label ("Today", "Yesterday", or a date) is
 * resolved by the screen from `messageDayKind`.
 */
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { radius, spacing, useColors } from '@/theme';

export type DateSeparatorProps = {
  label: string;
};

export function DateSeparator({ label }: DateSeparatorProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={[styles.pill, { backgroundColor: colors.surface }]}>
        <Text variant="caption" color="textSecondary">
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
});
