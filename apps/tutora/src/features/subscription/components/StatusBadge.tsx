/**
 * StatusBadge — a small outlined pill that renders a label in a theme tone (#58).
 *
 * The generic counterpart to the reviews `ReviewStatusBadge`: subscription and
 * payment statuses map to a color token + localized label upstream, and this only
 * paints the pill. An outline (no tinted fill) stays legible in both themes.
 */
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { radius, spacing, useColors, type ColorTokens } from '@/theme';

export type StatusBadgeProps = {
  label: string;
  tone: keyof ColorTokens;
};

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  const colors = useColors();

  return (
    <View style={[styles.pill, { borderColor: colors[tone] }]}>
      <Text variant="caption" color={tone}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
});
