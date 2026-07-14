/**
 * SubjectPriceRow — one taught subject with its optional price override
 * (tutor epic #51, #56).
 *
 * Shows the subject name, an inline price field (empty = fall back to the base
 * hourly rate), and a remove affordance. The override commits on blur: a valid
 * number sets it, a cleared field removes it, and an invalid entry snaps back to
 * the last good value so a typo never reaches the API.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Input, Text } from '@/components/ui';
import { HOURLY_RATE_MAX, HOURLY_RATE_MIN } from '../constants';
import { spacing, useColors } from '@/theme';
import type { TutorProfileSubject } from '../types';

export type SubjectPriceRowProps = {
  subject: TutorProfileSubject;
  currency: string;
  disabled?: boolean;
  onSetPrice: (priceOverride: number | undefined) => void;
  onRemove: () => void;
};

export function SubjectPriceRow({
  subject,
  currency,
  disabled = false,
  onSetPrice,
  onRemove,
}: SubjectPriceRowProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const [price, setPrice] = useState(
    subject.priceOverride != null ? String(subject.priceOverride) : '',
  );

  const commit = () => {
    const trimmed = price.trim();
    if (trimmed === '') {
      onSetPrice(undefined);
      return;
    }
    const value = Number(trimmed);
    if (Number.isNaN(value) || value < HOURLY_RATE_MIN || value > HOURLY_RATE_MAX) {
      // Reject a typo silently by restoring the last persisted value.
      setPrice(subject.priceOverride != null ? String(subject.priceOverride) : '');
      return;
    }
    onSetPrice(value);
  };

  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <View style={styles.name}>
        <Text variant="body" numberOfLines={1}>
          {subject.name}
        </Text>
      </View>

      <Input
        containerStyle={styles.priceField}
        value={price}
        onChangeText={setPrice}
        onBlur={commit}
        onEndEditing={commit}
        keyboardType="decimal-pad"
        placeholder={t('tutor.profile.subjects.basePrice', { currency })}
        disabled={disabled}
      />

      <Pressable
        onPress={onRemove}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={t('tutor.profile.subjects.remove', { subject: subject.name })}
        hitSlop={8}
        style={styles.remove}
      >
        <Icon name="trash" size={20} color="danger" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  name: {
    flex: 1,
  },
  priceField: {
    width: 120,
  },
  remove: {
    padding: spacing.xs,
  },
});
