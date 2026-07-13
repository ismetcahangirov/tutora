/**
 * StarRating — a row of five stars filled to a rating (student epic #40, #44).
 *
 * Presentational; rounds to the nearest whole star. Exposes the numeric rating to
 * assistive tech so the row is announced as "4 out of 5", not five separate
 * decorative icons.
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/ui';

const MAX_STARS = 5;

export type StarRatingProps = {
  rating: number;
  size?: number;
};

export function StarRating({ rating, size = 14 }: StarRatingProps) {
  const { t } = useTranslation();
  const filled = Math.round(rating);

  return (
    <View
      style={styles.row}
      accessibilityRole="image"
      accessibilityLabel={t('reviews.starsLabel', { rating: filled, max: MAX_STARS })}
    >
      {Array.from({ length: MAX_STARS }).map((_, index) => (
        <Icon key={index} name="star" size={size} color="accent" filled={index < filled} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 2,
  },
});
