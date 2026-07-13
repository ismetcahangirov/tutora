/**
 * ComparisonButton — a self-contained "add to compare" toggle (epic #40, #46).
 *
 * Purely presentational: it renders the current `active` state and calls
 * `onPress`; the caller owns the comparison store. Filled + primary when the
 * tutor is in the comparison, outline + muted when not. When the selection is at
 * capacity and this tutor is not part of it, the caller passes `disabled` — the
 * button dims and ignores taps so the student cannot exceed the column limit.
 * Mirrors `FavoriteButton` so a tutor card can stack the two corner actions.
 */
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/ui';
import { radius, useColors } from '@/theme';

export type ComparisonButtonProps = {
  active: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  /** Blocks adding once the comparison is full (ignored when already active). */
  disabled?: boolean;
  /** Icon size in px. Defaults to 18. */
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function ComparisonButton({
  active,
  onPress,
  accessibilityLabel,
  disabled = false,
  size = 18,
  style,
}: ComparisonButtonProps) {
  const colors = useColors();
  const isDisabled = disabled && !active;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active, disabled: isDisabled }}
      hitSlop={10}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.card, borderColor: active ? colors.primary : colors.border },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <Icon name={active ? 'check' : 'columns'} size={size} color={active ? 'primary' : 'muted'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  disabled: {
    opacity: 0.4,
  },
});
