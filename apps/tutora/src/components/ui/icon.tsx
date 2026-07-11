/**
 * Icon — a small, dependency-light SVG icon set (react-native-svg).
 *
 * The design system bans emoji as icons. Icons are stroke-based (Feather-style,
 * 24×24 viewBox) so they scale crisply and inherit a single `color`. Icons are
 * decorative by default; the interactive parent (Button, SearchBar…) owns the
 * accessible label.
 */
import Svg, { Circle, Line, Path, Polygon, Polyline } from 'react-native-svg';

import { useColors } from '@/theme';
import type { ColorTokens } from '@/theme';

export type IconName =
  | 'search'
  | 'close'
  | 'check'
  | 'chevron-down'
  | 'chevron-right'
  | 'filter'
  | 'star'
  | 'alert-circle'
  | 'inbox';

export type IconProps = {
  name: IconName;
  /** Pixel size (width and height). Defaults to 20 (list icon size). */
  size?: number;
  /** A theme color token; defaults to `textSecondary`. */
  color?: keyof ColorTokens;
  /** Fill the shape (used for active rating stars). */
  filled?: boolean;
  strokeWidth?: number;
};

const STROKE_PROPS = {
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function IconShape({ name, stroke, filled }: { name: IconName; stroke: string; filled: boolean }) {
  switch (name) {
    case 'search':
      return (
        <>
          <Circle cx={11} cy={11} r={8} />
          <Line x1={21} y1={21} x2={16.65} y2={16.65} />
        </>
      );
    case 'close':
      return (
        <>
          <Line x1={18} y1={6} x2={6} y2={18} />
          <Line x1={6} y1={6} x2={18} y2={18} />
        </>
      );
    case 'check':
      return <Polyline points="20 6 9 17 4 12" />;
    case 'chevron-down':
      return <Polyline points="6 9 12 15 18 9" />;
    case 'chevron-right':
      return <Polyline points="9 18 15 12 9 6" />;
    case 'filter':
      return <Polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />;
    case 'star':
      return (
        <Polygon
          points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          fill={filled ? stroke : 'none'}
        />
      );
    case 'alert-circle':
      return (
        <>
          <Circle cx={12} cy={12} r={10} />
          <Line x1={12} y1={8} x2={12} y2={12} />
          <Line x1={12} y1={16} x2={12.01} y2={16} />
        </>
      );
    case 'inbox':
      return (
        <>
          <Polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
          <Path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </>
      );
  }
}

export function Icon({
  name,
  size = 20,
  color = 'textSecondary',
  filled = false,
  strokeWidth,
}: IconProps) {
  const colors = useColors();
  const stroke = colors[color];

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      {...STROKE_PROPS}
      strokeWidth={strokeWidth ?? STROKE_PROPS.strokeWidth}
      accessibilityRole="image"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <IconShape name={name} stroke={stroke} filled={filled} />
    </Svg>
  );
}
