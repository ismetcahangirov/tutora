/**
 * HomeScreen — the student discovery surface (student epic #40, #42).
 *
 * Three stacked sections: a tappable search prompt, quick subject filters (from
 * the taxonomy), and a preview of top-rated tutors. Navigation is injected so the
 * screen stays testable; favorite state is wired once here for the featured
 * cards. Each section owns its loading / error / empty treatment; pull-to-refresh
 * re-reads both sources (#171/#175).
 */
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@features/auth';
import { useFavorites } from '@features/favorites';
import { useSubjects } from '@features/taxonomy';
import { ErrorState, FilterChip, Icon, Skeleton, Text } from '@/components/ui';
import { useRefreshControl } from '@/shared';
import { radius, spacing, useColors } from '@/theme';

import { TutorCard } from '../components/TutorCard';
import { TutorCardSkeletonList } from '../components/TutorCardSkeleton';
import { HOME_SUBJECT_LIMIT } from '../constants';
import { useFeaturedTutors } from '../hooks/useFeaturedTutors';
import { toFavoriteTutor, toTutorCardData } from '../mappers';

export type HomeScreenProps = {
  onPressTutor: (id: string) => void;
  onPressSearch: () => void;
  onPressSubject: (subjectId: string) => void;
};

export function HomeScreen({ onPressTutor, onPressSearch, onPressSubject }: HomeScreenProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const { user } = useAuth();
  const { isFavorite, toggle } = useFavorites();

  const {
    data: subjects = [],
    isLoading: subjectsLoading,
    isRefetching: subjectsRefetching,
    refetch: refetchSubjects,
  } = useSubjects();
  const {
    tutors: featured,
    isLoading: featuredLoading,
    isError: featuredError,
    isRefetching: featuredRefetching,
    refetch: refetchFeatured,
  } = useFeaturedTutors();

  const handleRefresh = () => {
    void refetchSubjects();
    refetchFeatured();
  };
  const refreshControl = useRefreshControl(subjectsRefetching || featuredRefetching, handleRefresh);

  const firstName = user?.name?.trim().split(/\s+/)[0];
  const greeting = firstName
    ? t('tutors.home.greetingNamed', { name: firstName })
    : t('tutors.home.greeting');

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        <View style={styles.header}>
          <Text variant="headline">{greeting}</Text>
          <Text variant="body" color="textSecondary">
            {t('tutors.home.subtitle')}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tutors.search.placeholder')}
          onPress={onPressSearch}
          style={[
            styles.searchPrompt,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Icon name="search" size={20} color="muted" />
          <Text variant="body" color="muted">
            {t('tutors.search.placeholder')}
          </Text>
        </Pressable>

        <View style={styles.section}>
          <Text variant="subtitle">{t('tutors.home.browseSubjects')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {subjectsLoading && subjects.length === 0
              ? Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} width={96} height={34} radius="full" />
                ))
              : subjects
                  .slice(0, HOME_SUBJECT_LIMIT)
                  .map((subject) => (
                    <FilterChip
                      key={subject.id}
                      label={subject.name}
                      onPress={() => onPressSubject(subject.id)}
                    />
                  ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="subtitle">{t('tutors.home.topRated')}</Text>
          </View>

          {featuredLoading ? (
            <TutorCardSkeletonList count={3} />
          ) : featuredError ? (
            <ErrorState
              title={t('tutors.home.errorTitle')}
              retryLabel={t('common.retry')}
              onRetry={refetchFeatured}
            />
          ) : (
            <View style={styles.featuredList}>
              {featured.map((item) => (
                <TutorCard
                  key={item.id}
                  tutor={toTutorCardData(item)}
                  isFavorite={isFavorite(item.id)}
                  onToggleFavorite={() => toggle(toFavoriteTutor(item))}
                  onPress={() => onPressTutor(item.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing['2xl'],
  },
  header: {
    gap: spacing.xs,
  },
  searchPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 48,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chips: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  featuredList: {
    gap: spacing.md,
  },
});
