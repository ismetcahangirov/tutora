/**
 * SubjectPriceRow — one taught subject with its optional price-override tiers
 * (tutor epic #51, #56; QA follow-up #178).
 *
 * Collapsed by default: shows the subject name, a one-line price summary (or a
 * "uses the base rate" placeholder when no override is set), and a remove
 * affordance. Tapping the row expands a `PricingTierEditor` so a tutor can set
 * a different amount per billing period; each change commits immediately (the
 * backend returns the refreshed profile, so there is no separate "save").
 */
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Text } from '@/components/ui';
import { formatPrice, pickDisplayTier } from '@/shared';
import { spacing, useColors } from '@/theme';

import { PricingTierEditor } from './PricingTierEditor';
import type { PricingTier, TutorProfileSubject } from '../types';

export type SubjectPriceRowProps = {
  subject: TutorProfileSubject;
  currency: string;
  disabled?: boolean;
  onChangeTiers: (pricingTiers: PricingTier[]) => void;
  onRemove: () => void;
};

export function SubjectPriceRow({
  subject,
  currency,
  disabled = false,
  onChangeTiers,
  onRemove,
}: SubjectPriceRowProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  const displayTier = pickDisplayTier(subject.pricingTiers);
  const summary =
    displayTier === null
      ? t('tutor.profile.subjects.noOverride')
      : `${formatPrice(displayTier.amount, currency)}${t(`tutors.pricePeriod.${displayTier.period}`)}`;

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <View style={styles.row}>
        <Pressable
          style={styles.summary}
          onPress={() => setExpanded((value) => !value)}
          accessibilityRole="button"
          accessibilityLabel={t('tutor.profile.subjects.editPricing', { subject: subject.name })}
          accessibilityState={{ expanded }}
        >
          <Text variant="body" numberOfLines={1} style={styles.name}>
            {subject.name}
          </Text>
          <View style={styles.priceRow}>
            <Text variant="bodySmall" color="textSecondary" numberOfLines={1}>
              {summary}
            </Text>
            <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={16} color="muted" />
          </View>
        </Pressable>

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

      {expanded ? (
        <PricingTierEditor
          tiers={subject.pricingTiers}
          currency={currency}
          disabled={disabled}
          onChange={onChangeTiers}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  summary: { flex: 1, gap: 2 },
  name: { flexShrink: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  remove: { padding: spacing.xs },
});
