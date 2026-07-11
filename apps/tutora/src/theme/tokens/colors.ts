/**
 * Color tokens — issue #9.
 *
 * The Tutora palette as light + dark theme tokens. Values are taken verbatim
 * from `.claude/context/ui-guidelines.md`. Flat solid fills only — gradients are
 * banned in every layer. Components must reference these semantic tokens and
 * never hardcode hex values.
 */

/** Semantic color roles shared by both themes. Keys are identical across modes. */
export type ColorTokens = {
  /** Primary actions, active states, links. */
  primary: string;
  /** Primary button pressed state. */
  primaryDark: string;
  /** Primary tinted backgrounds, chips. */
  primaryLight: string;
  /** Secondary actions, info chips. */
  secondary: string;
  /** Ratings (stars), highlights, badges. */
  accent: string;
  /** App / screen background. */
  background: string;
  /** Page sections, list backgrounds. */
  surface: string;
  /** Card backgrounds. */
  card: string;
  /** Card borders, dividers, input borders. */
  border: string;
  /** Subtle separators within lists. */
  divider: string;
  /** Headings, primary body copy. */
  textPrimary: string;
  /** Labels, secondary descriptors. */
  textSecondary: string;
  /** Placeholder text, disabled labels. */
  muted: string;
  /** Confirmed, accepted, verified. */
  success: string;
  /** Pending, attention needed. */
  warning: string;
  /** Errors, destructive actions. */
  danger: string;
  /** Informational banners. */
  info: string;
  /** Disabled control fills. */
  disabled: string;
  /** Text/icon color rendered on top of `primary`. */
  onPrimary: string;
  /** Modal / sheet backdrop. */
  overlay: string;
};

export const lightColors: ColorTokens = {
  primary: '#4F46E5',
  primaryDark: '#4338CA',
  primaryLight: '#EEF2FF',
  secondary: '#0EA5E9',
  accent: '#F59E0B',
  background: '#FFFFFF',
  surface: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  divider: '#EEF2F6',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  muted: '#94A3B8',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
  info: '#2563EB',
  disabled: '#CBD5E1',
  onPrimary: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.5)',
};

/**
 * Dark theme. Semantic status colors are inherited from light unless contrast on
 * the dark surface hierarchy falls below WCAG AA, in which case a lighter tint is
 * used (success/danger/info are lifted for legibility on `#0B1120`).
 */
export const darkColors: ColorTokens = {
  ...lightColors,
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#1E1B4B',
  background: '#0B1120',
  surface: '#111827',
  card: '#1E293B',
  border: '#334155',
  divider: '#1E293B',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  muted: '#64748B',
  success: '#22C55E',
  danger: '#F87171',
  info: '#60A5FA',
  disabled: '#334155',
  onPrimary: '#FFFFFF',
  overlay: 'rgba(2, 6, 23, 0.6)',
};
