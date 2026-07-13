/**
 * TutorCard — the tutor list/grid cell (student epic #40, #42/#43/#45).
 *
 * A single presentational cell reused across Home (featured), Search (results),
 * and Favorites (saved). It renders only the compact `TutorCardData` and is fully
 * controlled: the favorite state and both callbacks are injected, so the card
 * imports no store and the same component works with live results or persisted
 * snapshots. The whole card navigates to the profile; the corner heart toggles
 * the favorite without triggering that navigation (inner Pressable wins the tap).
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { FavoriteButton } from '@features/favorites';
import { Avatar, Card, Text } from '@/components/ui';
import { formatPrice } from '@/shared';
import { spacing } from '@/theme';

import { formatLabels } from '../format-labels';
import type { TutorCardData } from '../mappers';
import { TutorRating } from './TutorRating';
import { VerificationBadge } from './VerificationBadge';

export type TutorCardProps = {
  tutor: TutorCardData;
  onPress: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  testID?: string;
};

export function TutorCard({
  tutor,
  onPress,
  isFavorite,
  onToggleFavorite,
  testID,
}: TutorCardProps) {
  const { t } = useTranslation();
  const displayName = tutor.name ?? t('tutors.unnamed');

  return (
    <Card onPress={onPress} accessibilityLabel={displayName} testID={testID}>
      <View style={styles.row}>
        <Avatar uri={tutor.avatarUrl} name={tutor.name} />

        <View style={styles.body}>
          <View style={styles.nameRow}>
            <Text variant="subtitle" numberOfLines={1} style={styles.name}>
              {displayName}
            </Text>
            {tutor.isVerified ? <VerificationBadge /> : null}
          </View>

          <TutorRating average={tutor.ratingAvg} count={tutor.ratingCount} />

          {tutor.subjectNames.length > 0 ? (
            <Text variant="bodySmall" color="textSecondary" numberOfLines={1}>
              {tutor.subjectNames.join(' · ')}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <Text variant="label" color="primary">
              {formatPrice(tutor.hourlyRate, tutor.currency)}
              <Text variant="caption" color="textSecondary">
                {' '}
                {t('tutors.perHour')}
              </Text>
            </Text>
            {tutor.formats.length > 0 ? (
              <Text
                variant="caption"
                color="textSecondary"
                numberOfLines={1}
                style={styles.formats}
              >
                {formatLabels(t, tutor.formats)}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <FavoriteButton
        active={isFavorite}
        onPress={onToggleFavorite}
        accessibilityLabel={isFavorite ? t('favorites.remove') : t('favorites.add')}
        style={styles.favorite}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
    // Leave room for the absolutely-positioned favorite button.
    paddingRight: spacing['3xl'],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  formats: {
    flexShrink: 1,
    textAlign: 'right',
  },
  favorite: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
});
