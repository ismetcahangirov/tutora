/**
 * TaxonomyPickerSheet — add a subject / district / language to the profile
 * (tutor epic #51, #53, #56).
 *
 * One reusable sheet for all three taxonomy kinds: a search box over the reference
 * list with the already-selected items filtered out, so a tap only ever *adds*.
 * The sheet stays open after a pick so several can be added in a row; each pick
 * fires its mutation and the row vanishes once it lands in the profile. Rows are
 * disabled while a mutation is in flight to avoid double-adds.
 */
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { BottomSheet, Icon, SearchBar, Text } from '@/components/ui';
import { radius, spacing, useColors } from '@/theme';

/** The minimal shape every taxonomy option shares (subject, district, language). */
export type TaxonomyOption = { id: string; name: string };

export type TaxonomyPickerSheetProps = {
  visible: boolean;
  title: string;
  options: TaxonomyOption[];
  /** Ids already on the profile — excluded from the list. */
  selectedIds: string[];
  searchPlaceholder: string;
  emptyLabel: string;
  isMutating?: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function TaxonomyPickerSheet({
  visible,
  title,
  options,
  selectedIds,
  searchPlaceholder,
  emptyLabel,
  isMutating = false,
  onSelect,
  onClose,
}: TaxonomyPickerSheetProps) {
  const colors = useColors();
  const [query, setQuery] = useState('');

  const available = useMemo(() => {
    const selected = new Set(selectedIds);
    const needle = query.trim().toLowerCase();
    return options.filter(
      (option) =>
        !selected.has(option.id) && (needle === '' || option.name.toLowerCase().includes(needle)),
    );
  }, [options, selectedIds, query]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} snapPoints={['70%']}>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={searchPlaceholder}
        returnKeyType="search"
      />
      <ScrollView
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {available.length === 0 ? (
          <Text variant="body" color="textSecondary" align="center" style={styles.empty}>
            {emptyLabel}
          </Text>
        ) : (
          available.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => onSelect(option.id)}
              disabled={isMutating}
              accessibilityRole="button"
              accessibilityLabel={option.name}
              accessibilityState={{ disabled: isMutating }}
              style={({ pressed }) => [
                styles.row,
                { borderBottomColor: colors.divider },
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text variant="body">{option.name}</Text>
              <Icon name="check" size={20} color="primary" />
            </Pressable>
          ))
        )}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: {
    maxHeight: 360,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.xs,
  },
  empty: {
    paddingVertical: spacing['2xl'],
  },
});
