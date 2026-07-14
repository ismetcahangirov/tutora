/**
 * CurrentSubscriptionCard — the caller's active subscription (#58).
 *
 * Renders the plan, a status pill, and the period line: an in-force subscription
 * shows its renewal date and a cancel action; a canceled one shows how long access
 * lasts and offers no further cancel. Cancel-at-period-end means access continues
 * until `currentPeriodEnd`, so the copy reassures rather than alarms.
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Card, Text } from '@/components/ui';
import { formatShortDate } from '@/shared';
import { spacing, type ColorTokens } from '@/theme';

import type { Subscription, SubscriptionStatus } from '../types';
import { StatusBadge } from './StatusBadge';

export type CurrentSubscriptionCardProps = {
  subscription: Subscription;
  onCancel: () => void;
  isCancelling?: boolean;
};

/** Status → pill tone. In-force reads as success/warning; lapsed reads as muted. */
const STATUS_TONE: Record<SubscriptionStatus, keyof ColorTokens> = {
  ACTIVE: 'success',
  PAST_DUE: 'warning',
  CANCELED: 'warning',
  EXPIRED: 'muted',
};

/** Statuses where the subscription is still live and can be canceled. */
const IN_FORCE: SubscriptionStatus[] = ['ACTIVE', 'PAST_DUE'];

export function CurrentSubscriptionCard({
  subscription,
  onCancel,
  isCancelling = false,
}: CurrentSubscriptionCardProps) {
  const { t } = useTranslation();
  const canCancel = IN_FORCE.includes(subscription.status);
  const periodEnd = subscription.currentPeriodEnd
    ? formatShortDate(subscription.currentPeriodEnd)
    : null;

  const periodLine = periodEnd
    ? canCancel
      ? t('tutor.subscription.renews', { date: periodEnd })
      : t('tutor.subscription.accessUntil', { date: periodEnd })
    : null;

  return (
    <Card padding="lg" style={styles.card}>
      <View style={styles.header}>
        <Text variant="title">{subscription.planName}</Text>
        <StatusBadge
          label={t(`tutor.subscription.status.${subscription.status}`)}
          tone={STATUS_TONE[subscription.status]}
        />
      </View>

      {periodLine ? (
        <Text variant="bodySmall" color="textSecondary">
          {periodLine}
        </Text>
      ) : null}

      {canCancel ? (
        <Button
          label={t('tutor.subscription.cancel.action')}
          variant="outline"
          onPress={onCancel}
          loading={isCancelling}
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
});
