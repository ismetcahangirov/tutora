/**
 * TutorResultsList — the shared tutor list surface (student epic #40, #42/#43).
 *
 * Renders a `FlatList` of `TutorCard`s and owns the four data states (loading →
 * skeletons, error → retry, empty → guidance, success → cards). Favorite state is
 * wired once here via `useFavorites`, so every card across Home and Search toggles
 * the same store. Navigation is injected (`onPressTutor`) to keep the list
 * testable in isolation. Infinite scroll is opt-in via `onEndReached`.
 *
 * (`FlatList` is used over FlashList to keep the app dependency-light; pages are
 * capped at 20 items, and rows are memoized — a FlashList swap is a later perf
 * pass if lists grow unbounded.)
 */
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';

import { useFavorites } from '@features/favorites';
import { EmptyState, ErrorState, type IconName } from '@/components/ui';
import { spacing, useColors } from '@/theme';

import { toFavoriteTutor, toTutorCardData } from '../mappers';
import type { TutorSummary } from '../types';
import { TutorCard } from './TutorCard';
import { TutorCardSkeletonList } from './TutorCardSkeleton';

export type TutorResultsListProps = {
  tutors: TutorSummary[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onPressTutor: (id: string) => void;
  onEndReached?: () => void;
  isFetchingNextPage?: boolean;
  emptyIcon?: IconName;
  emptyTitle: string;
  emptyDescription?: string;
  errorTitle: string;
  errorDescription?: string;
  retryLabel: string;
  testID?: string;
};

export function TutorResultsList({
  tutors,
  isLoading,
  isError,
  onRetry,
  onPressTutor,
  onEndReached,
  isFetchingNextPage = false,
  emptyIcon = 'search',
  emptyTitle,
  emptyDescription,
  errorTitle,
  errorDescription,
  retryLabel,
  testID,
}: TutorResultsListProps) {
  const colors = useColors();
  const { isFavorite, toggle } = useFavorites();

  const renderItem = useCallback<ListRenderItem<TutorSummary>>(
    ({ item }) => (
      <TutorCard
        tutor={toTutorCardData(item)}
        isFavorite={isFavorite(item.id)}
        onToggleFavorite={() => toggle(toFavoriteTutor(item))}
        onPress={() => onPressTutor(item.id)}
      />
    ),
    [isFavorite, toggle, onPressTutor],
  );

  // Initial load with nothing to show yet → skeletons.
  if (isLoading && tutors.length === 0) {
    return (
      <View style={styles.fill} testID={testID}>
        <TutorCardSkeletonList />
      </View>
    );
  }

  // Hard error with no cached data → full error state.
  if (isError && tutors.length === 0) {
    return (
      <View style={styles.fill} testID={testID}>
        <ErrorState
          title={errorTitle}
          description={errorDescription}
          retryLabel={retryLabel}
          onRetry={onRetry}
        />
      </View>
    );
  }

  return (
    <FlatList
      testID={testID}
      data={tutors}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListEmptyComponent={
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <ActivityIndicator style={styles.footer} color={colors.primary} />
        ) : null
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={ItemSeparator}
      showsVerticalScrollIndicator={false}
    />
  );
}

function ItemSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  separator: {
    height: spacing.md,
  },
  footer: {
    paddingVertical: spacing.lg,
  },
});
