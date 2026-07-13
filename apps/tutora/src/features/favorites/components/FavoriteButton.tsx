/**
 * FavoriteButton — a self-contained heart toggle (student epic #40, #45).
 *
 * Purely presentational: it renders the current `active` state and calls
 * `onPress`; the caller owns the favorites store. Filled + primary when saved,
 * outline + muted when not. Sits on a soft circular surface so it reads clearly
 * on top of a tutor photo or card, and pads its tap target to the 44 pt minimum.
 * The caller passes a localized `accessibilityLabel` (e.g. "Save" / "Saved").
 */
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/ui';
import { radius, useColors } from '@/theme';

export type FavoriteButtonProps = {
  active: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  /** Heart size in px. Defaults to 20. */
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function FavoriteButton({
  active,
  onPress,
  accessibilityLabel,
  size = 20,
  style,
}: FavoriteButtonProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      hitSlop={10}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && styles.pressed,
        style,
      ]}
    >
      <Icon name="heart" size={size} color={active ? 'primary' : 'muted'} filled={active} />
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
});
