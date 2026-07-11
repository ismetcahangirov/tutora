/**
 * Skeleton — shimmer placeholder for loading content (issue #14).
 *
 * The shimmer is an opacity pulse (~1200 ms loop), not a moving highlight — a
 * left-to-right highlight is a gradient, and gradients are banned. Match the
 * skeleton's size and radius to the real content it stands in for. Skeletons are
 * hidden from screen readers; announce loading at the screen level instead.
 */
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, type DimensionValue, type ViewStyle } from 'react-native';

import { radius as radiusTokens, useColors, type RadiusToken } from '@/theme';

export type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: RadiusToken | number;
  style?: ViewStyle;
};

export function Skeleton({ width = '100%', height = 16, radius = 'sm', style }: SkeletonProps) {
  const colors = useColors();
  // Lazy state init keeps a single stable Animated.Value without reading a ref during render.
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const borderRadius = typeof radius === 'number' ? radius : radiusTokens[radius];

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius, backgroundColor: colors.border, opacity }, style]}
    />
  );
}

/** Convenience: a stack of skeleton lines for text placeholders. */
export function SkeletonText({
  lines = 3,
  lastLineWidth = '60%',
}: {
  lines?: number;
  lastLineWidth?: DimensionValue;
}) {
  return (
    <>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={12}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          style={index === 0 ? undefined : styles.lineGap}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  lineGap: {
    marginTop: 8,
  },
});
