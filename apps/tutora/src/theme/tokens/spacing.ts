/**
 * Spacing tokens — issue #11.
 *
 * 4pt grid. Every layout value must come from this scale; ad-hoc numbers are not
 * allowed. Values: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export type SpacingToken = keyof typeof spacing;
