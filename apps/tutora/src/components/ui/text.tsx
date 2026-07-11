/**
 * Text — the typographic primitive (issue #10 / #12).
 *
 * Applies a type-scale `variant` and a theme `color` token. Never hardcode font
 * sizes or hex colors in screens; compose from this component. `allowFontScaling`
 * stays on so text respects the system Dynamic Type setting (accessibility).
 */
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { typography, useColors, type ColorTokens, type TextVariant } from '@/theme';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: keyof ColorTokens;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
};

export function Text({
  variant = 'body',
  color = 'textPrimary',
  align,
  style,
  ...rest
}: TextProps) {
  const colors = useColors();

  return (
    <RNText
      style={[
        typography[variant],
        { color: colors[color] },
        align ? { textAlign: align } : null,
        style,
      ]}
      {...rest}
    />
  );
}
