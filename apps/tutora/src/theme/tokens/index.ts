/**
 * Design tokens barrel — issues #9, #10, #11.
 *
 * Static, mode-independent tokens (spacing, radius, typography, shadows) are
 * imported directly by components. Color tokens are resolved per theme via the
 * theme provider (see `../theme`).
 */
export { lightColors, darkColors } from './colors';
export type { ColorTokens } from './colors';

export { typography, fontFamily } from './typography';
export type { TextVariant } from './typography';

export { spacing } from './spacing';
export type { SpacingToken } from './spacing';

export { radius } from './radius';
export type { RadiusToken } from './radius';

export { shadows } from './shadows';
export type { ShadowToken } from './shadows';
