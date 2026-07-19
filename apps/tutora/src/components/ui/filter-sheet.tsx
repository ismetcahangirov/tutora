/**
 * FilterSheet — reusable, config-driven filter bottom sheet (issue #15).
 *
 * Sections (district, subject, price, rating, format, language…) are described as
 * chip options; each section is single- or multi-select. Selection is fully
 * controlled (`value`/`onChange`) so screens own the query state; Apply confirms
 * and closes, Reset clears. Copy is passed in for future localization.
 */
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { BottomSheet } from './bottom-sheet';
import { Button } from './button';
import { FilterChip } from './filter-chip';
import { Text } from './text';

export type FilterOption = { label: string; value: string };

export type FilterSection = {
  key: string;
  title: string;
  options: FilterOption[];
  /** Allow multiple selected values in this section. Defaults to false. */
  multiple?: boolean;
};

/** Map of section key → selected option values. */
export type FilterSelection = Record<string, string[]>;

export type FilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  sections: FilterSection[];
  value: FilterSelection;
  onChange: (value: FilterSelection) => void;
  onApply?: () => void;
  title?: string;
  applyLabel?: string;
  resetLabel?: string;
};

function toggleOption(
  selection: FilterSelection,
  key: string,
  optionValue: string,
  multiple: boolean,
): FilterSelection {
  const current = selection[key] ?? [];
  const isSelected = current.includes(optionValue);
  const next = multiple
    ? isSelected
      ? current.filter((v) => v !== optionValue)
      : [...current, optionValue]
    : isSelected
      ? []
      : [optionValue];
  return { ...selection, [key]: next };
}

export function FilterSheet({
  visible,
  onClose,
  sections,
  value,
  onChange,
  onApply,
  title = 'Filters',
  applyLabel = 'Apply',
  resetLabel = 'Reset',
}: FilterSheetProps) {
  const handleApply = () => {
    onApply?.();
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} snapPoints={['75%']} scrollable>
      <View style={styles.sections}>
        {sections.map((section) => {
          const selected = value[section.key] ?? [];
          return (
            <View key={section.key} style={styles.section}>
              <Text variant="label" color="textSecondary">
                {section.title}
              </Text>
              <View style={styles.chips}>
                {section.options.map((option) => (
                  <FilterChip
                    key={option.value}
                    label={option.label}
                    selected={selected.includes(option.value)}
                    onPress={() =>
                      onChange(
                        toggleOption(value, section.key, option.value, section.multiple ?? false),
                      )
                    }
                  />
                ))}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Button
          label={resetLabel}
          variant="ghost"
          onPress={() => onChange({})}
          style={styles.footerButton}
        />
        <Button
          label={applyLabel}
          variant="primary"
          onPress={handleApply}
          style={styles.footerButton}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  footerButton: {
    flex: 1,
  },
});
