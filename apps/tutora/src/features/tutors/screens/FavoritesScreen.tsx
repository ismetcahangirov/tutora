/**
 * FavoritesScreen — the saved-tutors tab (student epic #40, #45, #46).
 *
 * Renders the persisted favorites straight from the store — no network — so the
 * list is instant and works offline. A saved snapshot already carries everything
 * a card needs. Removing a favorite here updates the store, which every other
 * screen observes. Empty state guides the user to search.
 *
 * Doubles as the comparison entry point (#46): each card carries an "add to
 * compare" toggle, and once at least two tutors are picked a sticky tray offers
 * to open the side-by-side comparison.
 */
import { useCallback } from 'react';
import { FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useComparison, ComparisonBar } from '@features/comparison';
import { useFavorites, type FavoriteTutor } from '@features/favorites';
import { EmptyState, Text } from '@/components/ui';
import { spacing, useColors } from '@/theme';

import { TutorCard } from '../components/TutorCard';

export type FavoritesScreenProps = {
  onPressTutor: (id: string) => void;
  /** Open the side-by-side comparison for the current selection. */
  onCompare: () => void;
};

export function FavoritesScreen({ onPressTutor, onCompare }: FavoritesScreenProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const { favorites, toggle } = useFavorites();
  const comparison = useComparison();

  const renderItem = useCallback<ListRenderItem<FavoriteTutor>>(
    ({ item }) => (
      <TutorCard
        tutor={item}
        isFavorite
        onToggleFavorite={() => toggle(item)}
        onPress={() => onPressTutor(item.id)}
        comparison={{
          active: comparison.isSelected(item.id),
          disabled: comparison.isFull,
          onToggle: () =>
            comparison.toggle({ id: item.id, name: item.name, avatarUrl: item.avatarUrl }),
        }}
      />
    ),
    [toggle, onPressTutor, comparison],
  );

  const showBar = comparison.count > 0;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text variant="headline">{t('favorites.title')}</Text>
        {favorites.length > 0 ? (
          <Text variant="bodySmall" color="textSecondary">
            {t('favorites.count', { count: favorites.length })}
          </Text>
        ) : null}
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState
            icon="heart"
            title={t('favorites.emptyTitle')}
            description={t('favorites.emptyDescription')}
          />
        }
        contentContainerStyle={[styles.content, showBar && styles.contentWithBar]}
        ItemSeparatorComponent={ItemSeparator}
        showsVerticalScrollIndicator={false}
        testID="favorites-list"
      />

      {showBar ? (
        <ComparisonBar
          count={comparison.count}
          limit={comparison.limit}
          canCompare={comparison.canCompare}
          onCompare={onCompare}
          onClear={comparison.clear}
        />
      ) : null}
    </SafeAreaView>
  );
}

function ItemSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  content: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  // Extra bottom room so the sticky compare tray never covers the last card.
  contentWithBar: {
    paddingBottom: spacing['6xl'],
  },
  separator: {
    height: spacing.md,
  },
});
