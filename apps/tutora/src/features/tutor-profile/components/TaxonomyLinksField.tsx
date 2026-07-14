/**
 * TaxonomyLinksField — a labelled set of removable chips + an "add" button
 * (tutor epic #51, #53).
 *
 * Reused for the profile's districts and languages: each selected item is a chip
 * with a remove (×) affordance, and the add button opens the shared picker sheet.
 * Subjects have their own row component because they also carry a price (#56).
 */
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Icon, Text } from '@/components/ui';
import { radius, spacing, useColors } from '@/theme';

/** The minimal shape a chip needs. */
export type TaxonomyLink = { id: string; name: string };

export type TaxonomyLinksFieldProps = {
  title: string;
  items: TaxonomyLink[];
  addLabel: string;
  emptyLabel: string;
  removeLabel: (name: string) => string;
  disabled?: boolean;
  onAdd: () => void;
  onRemove: (id: string) => void;
};

export function TaxonomyLinksField({
  title,
  items,
  addLabel,
  emptyLabel,
  removeLabel,
  disabled = false,
  onAdd,
  onRemove,
}: TaxonomyLinksFieldProps) {
  const colors = useColors();

  return (
    <View style={styles.field}>
      <Text variant="label">{title}</Text>

      {items.length === 0 ? (
        <Text variant="bodySmall" color="textSecondary">
          {emptyLabel}
        </Text>
      ) : (
        <View style={styles.chips}>
          {items.map((item) => (
            <View
              key={item.id}
              style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text variant="label" color="textSecondary">
                {item.name}
              </Text>
              <Pressable
                onPress={() => onRemove(item.id)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={removeLabel(item.name)}
                hitSlop={8}
              >
                <Icon name="close" size={16} color="muted" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Button
        label={addLabel}
        variant="outline"
        size="compact"
        leadingIcon="search"
        onPress={onAdd}
        disabled={disabled}
        style={styles.addButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  addButton: {
    alignSelf: 'flex-start',
  },
});
