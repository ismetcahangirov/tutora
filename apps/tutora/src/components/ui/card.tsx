/**
 * Card — surface container (issue #12).
 *
 * Default radius `lg` (16), 1px border, and a soft level-1 shadow in light mode.
 * Dark-mode shadows are invisible, so the border alone separates the surface
 * (per the elevation guidance). Pass `onPress` to make the whole card tappable.
 */
import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';

import { radius, shadows, spacing, useTheme, type SpacingToken } from '@/theme';

export type CardProps = ViewProps & {
  onPress?: () => void;
  /** Inner padding token. Defaults to `lg` (16). */
  padding?: SpacingToken;
  /** Apply the level-1 shadow in light mode. Defaults to true. */
  elevated?: boolean;
};

export function Card({
  onPress,
  padding = 'lg',
  elevated = true,
  style,
  children,
  accessibilityRole,
  ...rest
}: CardProps) {
  const { colors, mode } = useTheme();

  const surfaceStyle = [
    styles.base,
    {
      backgroundColor: colors.card,
      borderColor: colors.border,
      padding: spacing[padding],
    },
    elevated && mode === 'light' ? shadows.sm : null,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole={accessibilityRole ?? 'button'}
        style={({ pressed }) => [
          surfaceStyle,
          pressed && { opacity: 0.94, transform: [{ scale: 0.99 }] },
        ]}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={surfaceStyle} accessibilityRole={accessibilityRole} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radius.lg,
  },
});
