/**
 * PaymentRow — one entry in the payment history (#58).
 *
 * Amount + date on the left, a status pill on the right. Statuses map to tones so
 * a failed charge reads as danger and a settled one as success at a glance.
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, Text } from '@/components/ui';
import { formatPrice, formatShortDate } from '@/shared';
import { spacing, type ColorTokens } from '@/theme';

import type { Payment, PaymentStatus } from '../types';
import { StatusBadge } from './StatusBadge';

export type PaymentRowProps = {
  payment: Payment;
};

/** Payment status → pill tone. */
const STATUS_TONE: Record<PaymentStatus, keyof ColorTokens> = {
  PENDING: 'warning',
  SUCCEEDED: 'success',
  FAILED: 'danger',
  REFUNDED: 'info',
};

export function PaymentRow({ payment }: PaymentRowProps) {
  const { t } = useTranslation();

  return (
    <Card padding="md" style={styles.card}>
      <View style={styles.info}>
        <Text variant="body">{formatPrice(payment.amount, payment.currency)}</Text>
        <Text variant="caption" color="textSecondary">
          {formatShortDate(payment.createdAt)}
        </Text>
      </View>
      <StatusBadge
        label={t(`tutor.subscription.payments.status.${payment.status}`)}
        tone={STATUS_TONE[payment.status]}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  info: {
    gap: spacing.xs,
  },
});
