/**
 * PlanCard — one plan in the catalogue (#58).
 *
 * Shows the plan name, monthly price, and its benefits. When it's the caller's
 * current plan it carries a "current" marker and no action; otherwise the parent
 * may pass `onSubscribe` to offer an upgrade. A free plan (`priceMonthly` 0)
 * renders its tier word instead of a "0" price.
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Card, Text } from '@/components/ui';
import { formatPrice } from '@/shared';
import { spacing } from '@/theme';

import type { SubscriptionPlan } from '../types';
import { EntitlementList } from './EntitlementList';
import { StatusBadge } from './StatusBadge';

export type PlanCardProps = {
  plan: SubscriptionPlan;
  isCurrent: boolean;
  isSubscribing?: boolean;
  onSubscribe?: () => void;
};

export function PlanCard({ plan, isCurrent, isSubscribing = false, onSubscribe }: PlanCardProps) {
  const { t } = useTranslation();
  const isPriced = plan.priceMonthly > 0;

  return (
    <Card padding="lg" style={styles.card}>
      <View style={styles.header}>
        <Text variant="title">{plan.name}</Text>
        {isCurrent ? (
          <StatusBadge label={t('tutor.subscription.currentBadge')} tone="primary" />
        ) : null}
      </View>

      <View style={styles.priceRow}>
        <Text variant="headline">
          {isPriced
            ? formatPrice(plan.priceMonthly, plan.currency)
            : t('tutor.subscription.tier.FREE')}
        </Text>
        {isPriced ? (
          <Text variant="bodySmall" color="textSecondary">
            {t('tutor.subscription.perMonth')}
          </Text>
        ) : null}
      </View>

      <EntitlementList entitlements={plan.entitlements} />

      {!isCurrent && onSubscribe ? (
        <Button
          label={t('tutor.subscription.cta', { plan: plan.name })}
          variant="primary"
          onPress={onSubscribe}
          loading={isSubscribing}
          fullWidth
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
});
