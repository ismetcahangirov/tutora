/**
 * FormatSelector — multi-select lesson-format chips (tutor epic #51, #53).
 *
 * A tutor teaches in one or more formats (online / at the student's home / at
 * their own place). Rendered as toggle chips that reuse the shared `FilterChip`
 * and the same `tutors.format.*` labels the student-facing surface uses, so a
 * format reads identically on both sides of the marketplace.
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { FilterChip } from '@/components/ui';
import type { LessonFormat } from '@features/tutors';
import { spacing } from '@/theme';

import { LESSON_FORMATS } from '../constants';

export type FormatSelectorProps = {
  value: LessonFormat[];
  onChange: (formats: LessonFormat[]) => void;
  disabled?: boolean;
};

export function FormatSelector({ value, onChange, disabled = false }: FormatSelectorProps) {
  const { t } = useTranslation();

  const toggle = (format: LessonFormat) => {
    if (disabled) {
      return;
    }
    onChange(value.includes(format) ? value.filter((f) => f !== format) : [...value, format]);
  };

  return (
    <View style={styles.row}>
      {LESSON_FORMATS.map((format) => (
        <FilterChip
          key={format}
          label={t(`tutors.format.${format}`, { defaultValue: format })}
          selected={value.includes(format)}
          onPress={() => toggle(format)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
