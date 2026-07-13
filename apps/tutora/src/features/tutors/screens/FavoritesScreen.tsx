/**
 * FavoritesScreen — the saved-tutors tab (student epic #40, #45).
 *
 * Renders the persisted favorites straight from the store — no network — so the
 * list is instant and works offline. A saved snapshot already carries everything
 * a card needs. Removing a favorite here updates the store, which every other
 * screen observes. Empty state guides the user to search.
 */
import { useCallback } from 'react';
import { FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFavorites, type FavoriteTutor } from '@features/favorites';
import { EmptyState, Text } from '@/components/ui';
import { spacing, useColors } from '@/theme';

import { TutorCard } from '../components/TutorCard';

export type FavoritesScreenProps = {
  onPressTutor: (id: string) => void;
};

export function FavoritesScreen({ onPressTutor }: FavoritesScreenProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const { favorites, toggle } = useFavorites();

  const renderItem = useCallback<ListRenderItem<FavoriteTutor>>(
    ({ item }) => (
      <TutorCard
        tutor={item}
        isFavorite
        onToggleFavorite={() => toggle(item)}
        onPress={() => onPressTutor(item.id)}
      />
    ),
    [toggle, onPressTutor],
  );

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
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={ItemSeparator}
        showsVerticalScrollIndicator={false}
        testID="favorites-list"
      />
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
  separator: {
    height: spacing.md,
  },
});
