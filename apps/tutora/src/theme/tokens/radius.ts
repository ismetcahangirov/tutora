/**
 * Border-radius tokens — issue #11.
 *
 * Default card radius is `lg` (16). `full` is a large constant used for pills,
 * avatars, and toggles.
 */
export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
} as const;

export type RadiusToken = keyof typeof radius;
