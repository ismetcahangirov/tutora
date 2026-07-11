/**
 * Elevation / shadow tokens — issue #11.
 *
 * Soft, low-elevation shadows only — no heavy drop shadows. Each level maps the
 * design-system spec to React Native's shadow props (iOS) plus `elevation`
 * (Android). Dark-mode shadows are effectively invisible, so surfaces separate
 * with a `border` color instead (handled per-component).
 */
import type { ViewStyle } from 'react-native';

export type ShadowToken = 'none' | 'sm' | 'md' | 'lg';

const SHADOW_COLOR = '#0F172A';

export const shadows: Record<ShadowToken, ViewStyle> = {
  /** Level 0 — flat surface. */
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  /** Level 1 — cards on white background. */
  sm: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  /** Level 2 — floating action buttons, active sheets. */
  md: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  /** Level 3 — modals, bottom sheets. */
  lg: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};
