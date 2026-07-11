/**
 * Typography tokens — issue #10.
 *
 * Plus Jakarta Sans type scale (fallback Inter → system). The `fontFamily` keys
 * match the exported font names from `@expo-google-fonts/plus-jakarta-sans`, which
 * become the runtime family name once loaded via `expo-font`. `fontWeight` is kept
 * as a fallback for the pre-load window and for platforms without the loaded font.
 */
import type { TextStyle } from 'react-native';

/** Runtime font-family names (registered by the font loader in the root layout). */
export const fontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

export type TextVariant =
  | 'display'
  | 'headline'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'label'
  | 'button';

type VariantStyle = Pick<
  TextStyle,
  'fontSize' | 'lineHeight' | 'fontWeight' | 'letterSpacing' | 'fontFamily'
>;

export const typography: Record<TextVariant, VariantStyle> = {
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -1,
    fontFamily: fontFamily.bold,
  },
  headline: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontFamily: fontFamily.bold,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: -0.5,
    fontFamily: fontFamily.semibold,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: 0,
    fontFamily: fontFamily.semibold,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0,
    fontFamily: fontFamily.regular,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0,
    fontFamily: fontFamily.regular,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0,
    fontFamily: fontFamily.regular,
  },
  label: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0,
    fontFamily: fontFamily.medium,
  },
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0,
    fontFamily: fontFamily.semibold,
  },
};
