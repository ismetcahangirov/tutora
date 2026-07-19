/**
 * ComparisonColumn — one tutor's column in the side-by-side compare view (#46).
 *
 * Each column is an independent component instance, so it owns its own profile
 * query via `useTutorDetail`: mounting/unmounting a column (as the student adds or
 * removes tutors) never breaks the rules of hooks, and each column resolves its
 * loading / error / success state on its own. The header (avatar + name) renders
 * immediately from the lightweight selection `entry` while the full attributes
 * stream in. The whole column opens the tutor's profile; the corner ✕ removes it
 * from the comparison (the inner press wins over the card's).
 */
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import type { ComparisonEntry } from '@features/comparison';
import { Avatar, Button, Card, Icon, SkeletonText, Text } from '@/components/ui';
import { formatPrice } from '@/shared';
import { radius, spacing, useColors } from '@/theme';

import { formatLabels } from '../format-labels';
import { useTutorDetail } from '../hooks/useTutorDetail';
import type { TutorProfile } from '../types';
import { TutorRating } from './TutorRating';
import { VerificationBadge } from './VerificationBadge';

/** Fixed column width so every tutor's rows line up as the row scrolls. */
export const COMPARISON_COLUMN_WIDTH = 232;

export type ComparisonColumnProps = {
  entry: ComparisonEntry;
  onRemove: () => void;
  onPress: () => void;
};

export function ComparisonColumn({ entry, onRemove, onPress }: ComparisonColumnProps) {
  const { t } = useTranslation();
  const { data: tutor, isLoading, isError, refetch } = useTutorDetail(entry.id);
  const displayName = tutor?.name ?? entry.name ?? t('tutors.unnamed');

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={displayName}
      style={styles.column}
      testID={`comparison-column-${entry.id}`}
    >
      <RemoveButton label={t('comparison.column.remove')} onPress={onRemove} />

      <View style={styles.header}>
        <Avatar uri={tutor?.avatarUrl ?? entry.avatarUrl} name={displayName} size={56} />
        <View style={styles.nameRow}>
          <Text variant="subtitle" numberOfLines={2} style={styles.name}>
            {displayName}
          </Text>
          {tutor?.verificationStatus === 'VERIFIED' ? <VerificationBadge /> : null}
        </View>
      </View>

      {isLoading ? (
        <SkeletonText lines={5} />
      ) : isError || !tutor ? (
        <ColumnError t={t} onRetry={() => void refetch()} />
      ) : (
        <ColumnAttributes t={t} tutor={tutor} />
      )}
    </Card>
  );
}

/** The labelled attribute rows shown once the profile has loaded. */
function ColumnAttributes({ t, tutor }: { t: TFunction; tutor: TutorProfile }) {
  return (
    <View style={styles.attributes}>
      <Attribute label={t('comparison.attributes.rating')}>
        <TutorRating average={tutor.ratingAvg} count={tutor.ratingCount} />
      </Attribute>

      <Attribute label={t('comparison.attributes.price')}>
        <Text variant="label" color="primary">
          {tutor.hourlyRate === null ? (
            <Text variant="caption" color="textSecondary">
              {t('tutors.noPriceSet')}
            </Text>
          ) : (
            <>
              {formatPrice(tutor.hourlyRate, tutor.currency)}
              <Text variant="caption" color="textSecondary">
                {' '}
                {t('tutors.pricePeriod.HOURLY')}
              </Text>
            </>
          )}
        </Text>
      </Attribute>

      <Attribute label={t('comparison.attributes.experience')}>
        <ValueText>
          {t('comparison.attributes.experienceValue', { count: tutor.experienceYears })}
        </ValueText>
      </Attribute>

      <Attribute label={t('comparison.attributes.formats')}>
        <ValueText>{listOr(formatLabels(t, tutor.formats))}</ValueText>
      </Attribute>

      <Attribute label={t('comparison.attributes.subjects')}>
        <ValueText>{listOr(tutor.subjects.map((subject) => subject.name).join(' · '))}</ValueText>
      </Attribute>

      <Attribute label={t('comparison.attributes.districts')}>
        <ValueText>
          {listOr(tutor.districts.map((district) => district.name).join(' · '))}
        </ValueText>
      </Attribute>

      <Attribute label={t('comparison.attributes.languages')}>
        <ValueText>
          {listOr(tutor.languages.map((language) => language.name).join(' · '))}
        </ValueText>
      </Attribute>
    </View>
  );
}

/** A labelled attribute cell: a muted caption over its value. */
function Attribute({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.attribute}>
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      {children}
    </View>
  );
}

function ValueText({ children }: { children: React.ReactNode }) {
  return (
    <Text variant="bodySmall" color="textPrimary">
      {children}
    </Text>
  );
}

/** A compact, in-column error with retry — the full ErrorState is too wide here. */
function ColumnError({ t, onRetry }: { t: TFunction; onRetry: () => void }) {
  return (
    <View style={styles.error}>
      <Icon name="alert-circle" size={20} color="danger" />
      <Text variant="caption" color="textSecondary" align="center">
        {t('comparison.column.error')}
      </Text>
      <Button label={t('common.retry')} variant="ghost" size="compact" onPress={onRetry} />
    </View>
  );
}

function RemoveButton({ label, onPress }: { label: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [
        styles.remove,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.removePressed,
      ]}
    >
      <Icon name="close" size={16} color="textSecondary" />
    </Pressable>
  );
}

/** Fall back to an em dash for an empty attribute so columns stay aligned. */
function listOr(value: string): string {
  return value.length > 0 ? value : '—';
}

const styles = StyleSheet.create({
  column: {
    width: COMPARISON_COLUMN_WIDTH,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
    paddingRight: spacing['2xl'],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    flexShrink: 1,
  },
  attributes: {
    gap: spacing.md,
  },
  attribute: {
    gap: 2,
  },
  error: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  remove: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
    width: 30,
    height: 30,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePressed: {
    opacity: 0.7,
  },
});
