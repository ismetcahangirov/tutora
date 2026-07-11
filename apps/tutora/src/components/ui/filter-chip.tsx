/**
 * FilterChip — selectable pill for filters (issue #15).
 *
 * Inactive: surface fill, border, secondary text. Active: primary-light fill,
 * primary border and text. Exposes `selected` to assistive tech and pads its tap
 * target to the 44 pt minimum via `hitSlop`.
 */
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing, useColors } from '@/theme';

import { Text } from './text';

export type FilterChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function FilterChip({ label, selected = false, onPress, style }: FilterChipProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={{ top: 6, bottom: 6 }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primaryLight : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
        style,
      ]}
    >
      <Text variant="label" color={selected ? 'primary' : 'textSecondary'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
  },
});
