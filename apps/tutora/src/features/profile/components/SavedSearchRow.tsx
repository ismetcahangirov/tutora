/**
 * SavedSearchRow — one saved search in the Profile list (student epic #40, #49).
 *
 * Tapping the row applies the saved query + filters (the screen navigates to the
 * Search tab); the trailing ✕ deletes it. The subtitle summarises how many filter
 * sections the search carries. Presentational — the store lives in the
 * `saved-searches` feature and the actions are injected.
 */
import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { SavedSearch } from '@features/saved-searches';
import { Icon } from '@/components/ui';
import { radius, useColors } from '@/theme';

import { SettingRow } from './SettingRow';

export type SavedSearchRowProps = {
  search: SavedSearch;
  onApply: () => void;
  onDelete: () => void;
};

/** Count the filter sections that carry at least one selected value. */
function activeFilterCount(selection: SavedSearch['selection']): number {
  return Object.values(selection).filter((values) => values.length > 0).length;
}

export function SavedSearchRow({ search, onApply, onDelete }: SavedSearchRowProps) {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <SettingRow
      icon="search"
      label={search.name}
      description={t('profile.savedSearches.filters', {
        count: activeFilterCount(search.selection),
      })}
      onPress={onApply}
      accessibilityLabel={t('profile.savedSearches.apply')}
      trailing={
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={t('profile.savedSearches.delete')}
          hitSlop={8}
          style={({ pressed }) => [
            styles.delete,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && styles.pressed,
          ]}
        >
          <Icon name="close" size={16} color="textSecondary" />
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  delete: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
