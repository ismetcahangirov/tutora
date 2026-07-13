/**
 * RatingInput — an interactive 1–5 star picker for authoring a review (#48).
 *
 * Each star is its own button so screen readers announce and select a rating
 * directly; the tap target is padded to the 44×44 minimum. Filled stars use the
 * accent (rating) token; empties fall back to the border color.
 */
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/ui';
import { spacing } from '@/theme';

import { MAX_RATING } from '../constants';

export type RatingInputProps = {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
  disabled?: boolean;
};

export function RatingInput({ value, onChange, size = 36, disabled = false }: RatingInputProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.row}>
      {Array.from({ length: MAX_RATING }).map((_, index) => {
        const rating = index + 1;
        const isFilled = rating <= value;
        return (
          <Pressable
            key={rating}
            onPress={() => onChange(rating)}
            disabled={disabled}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityState={{ selected: isFilled, disabled }}
            accessibilityLabel={t('reviews.compose.rateStars', { rating, max: MAX_RATING })}
            style={styles.star}
            testID={`rating-star-${rating}`}
          >
            <Icon
              name="star"
              size={size}
              color={isFilled ? 'accent' : 'border'}
              filled={isFilled}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  star: {
    padding: spacing.xs,
  },
});
