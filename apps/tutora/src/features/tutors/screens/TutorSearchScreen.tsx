/**
 * TutorSearchScreen — debounced search + filter sheet (student epic #40, #43, #49).
 *
 * Owns the search UI state: the immediate text (for the input) plus a debounced
 * query (for the request), the chip `selection`, and the sheet's visibility. The
 * typed API params are *derived* from those via `deriveSearchParams` — no effects
 * syncing state — and fed to `useTutorSearch`, whose infinite query drives the
 * paginated results list. May be opened pre-filtered by subject from the Home
 * screen (`initialSubjectId`) or pre-filled from a saved search (`initialSelection`
 * + `initialQuery`). The bookmark action persists the current query + filters as a
 * saved search (#49).
 */
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSavedSearches } from '@features/saved-searches';
import {
  FilterSheet,
  Icon,
  SearchBar,
  Text,
  useToast,
  type FilterSelection,
} from '@/components/ui';
import { radius, spacing, useColors } from '@/theme';

import { TutorResultsList } from '../components/TutorResultsList';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { useTutorFilterSections } from '../hooks/useTutorFilterSections';
import { useTutorSearch } from '../hooks/useTutorSearch';
import { FILTER_KEYS, countActiveFilters, deriveSearchParams } from '../search-filters';

export type TutorSearchScreenProps = {
  /** Preselect a subject when arriving from a Home quick-filter. */
  initialSubjectId?: string;
  /** Seed the whole chip selection (e.g. applying a saved search). */
  initialSelection?: FilterSelection;
  /** Seed the search text (e.g. applying a saved search). */
  initialQuery?: string;
  onPressTutor: (id: string) => void;
};

/** The starting chip selection: an explicit preset wins over a single subject. */
function initialSelectionFrom(
  initialSelection: FilterSelection | undefined,
  initialSubjectId: string | undefined,
): FilterSelection {
  if (initialSelection) {
    return initialSelection;
  }
  return initialSubjectId ? { [FILTER_KEYS.subject]: [initialSubjectId] } : {};
}

export function TutorSearchScreen({
  initialSubjectId,
  initialSelection,
  initialQuery,
  onPressTutor,
}: TutorSearchScreenProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const sections = useTutorFilterSections();
  const { save, limit: savedSearchLimit } = useSavedSearches();

  const [query, setQuery] = useState(initialQuery ?? '');
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery ?? '');
  const [selection, setSelection] = useState<FilterSelection>(
    initialSelectionFrom(initialSelection, initialSubjectId),
  );
  const [isSheetOpen, setSheetOpen] = useState(false);

  const params = deriveSearchParams(selection, debouncedQuery);
  const {
    tutors,
    total,
    isLoading,
    isError,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useTutorSearch({ ...params, limit: DEFAULT_PAGE_SIZE });

  const activeFilters = countActiveFilters(selection);
  const trimmedQuery = debouncedQuery.trim();
  const canSaveSearch = activeFilters > 0 || trimmedQuery.length > 0;

  const handleSaveSearch = () => {
    const saved = save({
      name: trimmedQuery || t('savedSearches.untitled'),
      query: trimmedQuery,
      selection,
    });
    toast.show({
      message: saved
        ? t('savedSearches.saved')
        : t('savedSearches.limitReached', { limit: savedSearchLimit }),
      type: saved ? 'success' : 'info',
    });
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.controls}>
        <View style={styles.searchRow}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onDebouncedChange={setDebouncedQuery}
            placeholder={t('tutors.search.placeholder')}
            returnKeyType="search"
            style={styles.searchBar}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('tutors.filters.open')}
            accessibilityState={{ expanded: isSheetOpen }}
            onPress={() => setSheetOpen(true)}
            style={[
              styles.filterButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Icon name="filter" size={20} color={activeFilters > 0 ? 'primary' : 'textSecondary'} />
            {activeFilters > 0 ? (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text variant="caption" color="onPrimary">
                  {activeFilters}
                </Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('savedSearches.save')}
            accessibilityState={{ disabled: !canSaveSearch }}
            disabled={!canSaveSearch}
            onPress={handleSaveSearch}
            testID="tutor-search-save"
            style={[
              styles.filterButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              !canSaveSearch && styles.disabledButton,
            ]}
          >
            <Icon name="bookmark" size={20} color={canSaveSearch ? 'primary' : 'muted'} />
          </Pressable>
        </View>

        {!isLoading && !isError ? (
          <Text variant="bodySmall" color="textSecondary">
            {t('tutors.search.resultCount', { count: total })}
          </Text>
        ) : null}
      </View>

      <TutorResultsList
        tutors={tutors}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onPressTutor={onPressTutor}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        isFetchingNextPage={isFetchingNextPage}
        isRefetching={isRefetching}
        onRefresh={refetch}
        emptyIcon="search"
        emptyTitle={t('tutors.search.emptyTitle')}
        emptyDescription={t('tutors.search.emptyDescription')}
        errorTitle={t('tutors.search.errorTitle')}
        errorDescription={t('tutors.search.errorDescription')}
        retryLabel={t('common.retry')}
        testID="tutor-search-results"
      />

      <FilterSheet
        visible={isSheetOpen}
        onClose={() => setSheetOpen(false)}
        sections={sections}
        value={selection}
        onChange={setSelection}
        title={t('tutors.filters.title')}
        applyLabel={t('tutors.filters.apply')}
        resetLabel={t('tutors.filters.reset')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  controls: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  badge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    minWidth: 18,
    height: 18,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
});
