/**
 * TutorDashboardScreen — the tutor's home tab (tutor epic #51, #52).
 *
 * An at-a-glance overview built entirely from data the profile + applications
 * features already own: headline stats (profile views, rating, reviews, pending
 * applications), profile readiness, and quick jumps to the Profile and
 * Applications tabs. Every data state is handled and pull-to-refresh re-reads
 * both sources. Navigation is injected so the screen stays route-agnostic.
 */
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@features/auth';
import { Button, ErrorState, LoadingState, Text } from '@/components/ui';
import { formatRating } from '@/shared';
import { spacing, useColors } from '@/theme';

import { ProfileStatusCard } from '../components/ProfileStatusCard';
import { StatCard } from '../components/StatCard';
import { useTutorDashboard } from '../hooks/useTutorDashboard';

export type TutorDashboardScreenProps = {
  onEditProfile: () => void;
  onViewApplications: () => void;
};

export function TutorDashboardScreen({
  onEditProfile,
  onViewApplications,
}: TutorDashboardScreenProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const { user } = useAuth();
  const { profile, pendingApplications, isLoading, isError, isRefetching, refetch } =
    useTutorDashboard();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.titleBar}>
        <Text variant="bodySmall" color="textSecondary">
          {t('tutor.dashboard.greeting', { name: user?.name ?? '' }).trim()}
        </Text>
        <Text variant="headline">{t('tutor.dashboard.title')}</Text>
      </View>

      {isLoading ? (
        <LoadingState label={t('common.loading')} />
      ) : isError || !profile ? (
        <ErrorState
          title={t('tutor.dashboard.errorTitle')}
          description={t('tutor.dashboard.errorDescription')}
          retryLabel={t('common.retry')}
          onRetry={refetch}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.statsRow}>
            <StatCard
              icon="user"
              value={String(profile.profileViews)}
              label={t('tutor.dashboard.stats.views')}
            />
            <StatCard
              icon="star"
              value={profile.ratingCount > 0 ? formatRating(profile.ratingAvg) : '—'}
              label={t('tutor.dashboard.stats.rating')}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon="message-circle"
              value={String(profile.ratingCount)}
              label={t('tutor.dashboard.stats.reviews')}
            />
            <StatCard
              icon="inbox"
              value={String(pendingApplications)}
              label={t('tutor.dashboard.stats.pending')}
              onPress={onViewApplications}
              accessibilityLabel={t('tutor.dashboard.stats.pendingA11y', {
                count: pendingApplications,
              })}
            />
          </View>

          <ProfileStatusCard profile={profile} onManageProfile={onEditProfile} />

          <View style={styles.actions}>
            <Button
              label={t('tutor.dashboard.actions.editProfile')}
              variant="outline"
              leadingIcon="edit"
              onPress={onEditProfile}
              fullWidth
            />
            <Button
              label={t('tutor.dashboard.actions.viewApplications')}
              variant="outline"
              leadingIcon="inbox"
              onPress={onViewApplications}
              fullWidth
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  titleBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
    gap: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  actions: {
    gap: spacing.md,
  },
});
