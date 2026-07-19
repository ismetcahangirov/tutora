/**
 * TutorProfileHero — the top of the tutor profile (student epic #40, #44).
 *
 * Large avatar, name with an inline verified badge, rating, and the two headline
 * stats (hourly rate + years of experience). Kept as its own component so the
 * detail screen stays a readable composition of sections.
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar, Icon, Text } from '@/components/ui';
import { formatPrice } from '@/shared';
import { radius, spacing, useColors } from '@/theme';

import type { TutorProfile } from '../types';
import { TutorRating } from './TutorRating';
import { VerificationBadge } from './VerificationBadge';

export type TutorProfileHeroProps = {
  tutor: TutorProfile;
};

export function TutorProfileHero({ tutor }: TutorProfileHeroProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const displayName = tutor.name ?? t('tutors.unnamed');
  const isVerified = tutor.verificationStatus === 'VERIFIED';

  return (
    <View style={styles.hero}>
      <Avatar uri={tutor.avatarUrl} name={tutor.name} size={96} />

      <View style={styles.nameRow}>
        <Text variant="title" align="center" numberOfLines={1} style={styles.name}>
          {displayName}
        </Text>
        {isVerified ? <VerificationBadge showLabel /> : null}
      </View>

      <TutorRating average={tutor.ratingAvg} count={tutor.ratingCount} />

      <View style={[styles.stats, { borderColor: colors.border }]}>
        <View style={styles.stat}>
          <Text variant="title" color="primary">
            {formatPrice(tutor.hourlyRate, tutor.currency)}
          </Text>
          <Text variant="caption" color="textSecondary">
            {t('tutors.perHour')}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.stat}>
          <View style={styles.statValue}>
            <Icon name="clock" size={18} color="textSecondary" />
            <Text variant="title">{tutor.experienceYears}</Text>
          </View>
          <Text variant="caption" color="textSecondary">
            {t('tutors.detail.experienceYears', { count: tutor.experienceYears })}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignSelf: 'stretch',
    maxWidth: '100%',
  },
  name: {
    flexShrink: 1,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2xl'],
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
  },
});
