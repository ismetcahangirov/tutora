/**
 * Button — core action component (issue #12).
 *
 * Variants: primary · outline · ghost · danger, plus disabled and loading states.
 * Sizes map to the 40/48/56 pt heights in the UI guidelines. Press feedback
 * (scale + tint) uses Pressable's pressed state — a tap needs no Reanimated
 * worklet — keeping the component cheap and easy to test.
 */
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { radius, spacing, useColors, type ColorTokens } from '@/theme';

import { Icon, type IconName } from './icon';
import { Text } from './text';

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'compact' | 'standard' | 'large';

export type ButtonProps = Omit<PressableProps, 'children' | 'style' | 'disabled'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  /** Fully rounded (pill) instead of the default `md` radius. */
  pill?: boolean;
  leadingIcon?: IconName;
  /** Outer layout style (margins, alignment). Visual styling is variant-driven. */
  style?: StyleProp<ViewStyle>;
};

const HEIGHT: Record<ButtonSize, number> = { compact: 40, standard: 48, large: 56 };

type VariantColors = {
  bg: string;
  bgPressed: string;
  textToken: keyof ColorTokens;
  borderColor: string;
  borderWidth: number;
  pressedOpacity: number;
};

function getVariantColors(
  colors: ColorTokens,
  variant: ButtonVariant,
  disabled: boolean,
): VariantColors {
  if (disabled) {
    return {
      bg: colors.disabled,
      bgPressed: colors.disabled,
      textToken: 'muted',
      borderColor: 'transparent',
      borderWidth: 0,
      pressedOpacity: 1,
    };
  }

  switch (variant) {
    case 'primary':
      return {
        bg: colors.primary,
        bgPressed: colors.primaryDark,
        textToken: 'onPrimary',
        borderColor: 'transparent',
        borderWidth: 0,
        pressedOpacity: 1,
      };
    case 'danger':
      return {
        bg: colors.danger,
        bgPressed: colors.danger,
        textToken: 'onPrimary',
        borderColor: 'transparent',
        borderWidth: 0,
        pressedOpacity: 0.85,
      };
    case 'outline':
      return {
        bg: 'transparent',
        bgPressed: colors.primaryLight,
        textToken: 'primary',
        borderColor: colors.primary,
        borderWidth: 1.5,
        pressedOpacity: 1,
      };
    case 'ghost':
      return {
        bg: 'transparent',
        bgPressed: colors.primaryLight,
        textToken: 'primary',
        borderColor: 'transparent',
        borderWidth: 0,
        pressedOpacity: 1,
      };
  }
}

export function Button({
  label,
  variant = 'primary',
  size = 'standard',
  loading = false,
  disabled = false,
  fullWidth = false,
  pill = false,
  leadingIcon,
  accessibilityLabel,
  style,
  ...rest
}: ButtonProps) {
  const colors = useColors();
  const isDisabled = disabled || loading;
  const v = getVariantColors(colors, variant, isDisabled);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={size === 'compact' ? { top: 4, bottom: 4 } : undefined}
      style={({ pressed }) => [
        styles.base,
        {
          height: HEIGHT[size],
          borderRadius: pill ? radius.full : radius.md,
          backgroundColor: v.bg,
          borderColor: v.borderColor,
          borderWidth: v.borderWidth,
        },
        fullWidth && styles.fullWidth,
        style,
        pressed && {
          backgroundColor: v.bgPressed,
          opacity: v.pressedOpacity,
          transform: [{ scale: 0.98 }],
        },
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={colors[v.textToken]} />
      ) : (
        <View style={styles.content}>
          {leadingIcon ? <Icon name={leadingIcon} size={18} color={v.textToken} /> : null}
          <Text variant="button" color={v.textToken}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
});
