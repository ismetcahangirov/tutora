/**
 * PricingTierEditor — one amount field per billing period (tutor epic #51,
 * #56; QA follow-up #178).
 *
 * Shared by the base-rate editor (`ProfileBasicsForm`) and each subject's
 * price-override editor (`SubjectPriceRow`): both are "up to one amount per
 * period" collections, so they share this row set instead of duplicating the
 * commit/validate logic. An empty field means "no tier for this period"; a
 * valid entry commits on blur, and an invalid one snaps back to the last good
 * value so a typo never reaches the API.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui';
import { spacing } from '@/theme';

import { PRICING_AMOUNT_MAX, PRICING_AMOUNT_MIN, PRICING_PERIODS } from '../constants';
import type { PricingPeriod, PricingTier } from '../types';

export type PricingTierEditorProps = {
  tiers: PricingTier[];
  currency: string;
  disabled?: boolean;
  onChange: (tiers: PricingTier[]) => void;
};

export function PricingTierEditor({
  tiers,
  currency,
  disabled = false,
  onChange,
}: PricingTierEditorProps) {
  return (
    <View style={styles.list}>
      {PRICING_PERIODS.map((period) => (
        <PeriodInput
          key={period}
          period={period}
          amount={tiers.find((tier) => tier.period === period)?.amount ?? null}
          currency={currency}
          disabled={disabled}
          onCommit={(amount) => {
            const rest = tiers.filter((tier) => tier.period !== period);
            onChange(amount === null ? rest : [...rest, { period, amount }]);
          }}
        />
      ))}
    </View>
  );
}

type PeriodInputProps = {
  period: PricingPeriod;
  amount: number | null;
  currency: string;
  disabled: boolean;
  onCommit: (amount: number | null) => void;
};

function PeriodInput({ period, amount, currency, disabled, onCommit }: PeriodInputProps) {
  const { t } = useTranslation();
  const [text, setText] = useState(amount !== null ? String(amount) : '');

  const commit = () => {
    const trimmed = text.trim();
    if (trimmed === '') {
      onCommit(null);
      return;
    }
    const value = Number(trimmed);
    if (Number.isNaN(value) || value < PRICING_AMOUNT_MIN || value > PRICING_AMOUNT_MAX) {
      // Reject a typo silently by restoring the last persisted value.
      setText(amount !== null ? String(amount) : '');
      return;
    }
    onCommit(value);
  };

  return (
    <Input
      label={t(`tutor.profile.pricing.period.${period}`)}
      value={text}
      onChangeText={setText}
      onBlur={commit}
      onEndEditing={commit}
      keyboardType="decimal-pad"
      placeholder={t('tutor.profile.pricing.amountPlaceholder', { currency })}
      disabled={disabled}
    />
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
});
