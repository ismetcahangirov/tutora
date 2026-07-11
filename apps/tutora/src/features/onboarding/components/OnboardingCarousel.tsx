/**
 * OnboardingCarousel — swipeable value-proposition slides (issue #23).
 *
 * A horizontal, paged FlatList with a dots indicator. Purely presentational: it
 * takes the slides to show and tracks only the active page for the indicator.
 */
import { useCallback, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { Text } from '@/components/ui';
import { radius, spacing, useColors } from '@/theme';

import type { OnboardingSlide } from '../types';

export type OnboardingCarouselProps = {
  slides: OnboardingSlide[];
};

export function OnboardingCarousel({ slides }: OnboardingCarouselProps) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const page = Math.round(event.nativeEvent.contentOffset.x / width);
      setActiveIndex(page);
    },
    [width],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={slides}
        keyExtractor={(slide) => slide.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]} accessibilityLabel={item.title}>
            <Text variant="display" align="center">
              {item.title}
            </Text>
            <Text variant="body" color="textSecondary" align="center">
              {item.description}
            </Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {slides.map((slide, index) => (
          <View
            key={slide.key}
            style={[
              styles.dot,
              {
                backgroundColor: index === activeIndex ? colors.primary : colors.border,
                width: index === activeIndex ? spacing.md : spacing.sm,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  dot: {
    height: spacing.sm,
    borderRadius: radius.full,
  },
});
