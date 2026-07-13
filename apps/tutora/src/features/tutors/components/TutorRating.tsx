/**
 * TutorRating — star + average + review count (student epic #40).
 *
 * A tutor with no reviews yet shows a localized "New" label instead of a bare
 * `0.0`, which would read as a bad score. The star uses the `accent` token
 * (amber), consistent with the design system's rating color.
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Text } from '@/components/ui';
import { formatRating } from '@/shared';
import { spacing } from '@/theme';

export type TutorRatingProps = {
  average: number;
  count: number;
  /** Hide the "(N)" review count (e.g. in tight layouts). Defaults to false. */
  hideCount?: boolean;
};

export function TutorRating({ average, count, hideCount = false }: TutorRatingProps) {
  const { t } = useTranslation();

  if (count === 0) {
    return (
      <Text variant="label" color="textSecondary">
        {t('tutors.rating.new')}
      </Text>
    );
  }

  return (
    <View style={styles.row}>
      <Icon name="star" size={16} color="accent" filled />
      <Text variant="label" color="textPrimary">
        {formatRating(average)}
      </Text>
      {hideCount ? null : (
        <Text variant="caption" color="textSecondary">
          {t('tutors.rating.count', { count })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
