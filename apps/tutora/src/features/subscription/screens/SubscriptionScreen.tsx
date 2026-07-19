/**
 * SubscriptionScreen — the tutor's membership hub (tutor epic #51, #58).
 *
 * One scrollable surface: the caller's active subscription (with a cancel-at-
 * period-end action) sits above the plan catalogue, and the payment history
 * follows when there is one. Subscribing and cancelling are both confirmed behind
 * a modal — a tap can't start (or stop) billing by accident — and every data state
 * (loading, error with retry, loaded) is handled. Reached from the Profile tab and
 * pushed full-screen over the tab bar, mirroring `/reviews`.
 */
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ErrorState, LoadingState, Modal, Text, useToast } from '@/components/ui';
import { formatPrice, useRefreshControl } from '@/shared';
import { spacing, useColors } from '@/theme';

import { CurrentSubscriptionCard } from '../components/CurrentSubscriptionCard';
import { PaymentRow } from '../components/PaymentRow';
import { PlanCard } from '../components/PlanCard';
import { useCancelSubscription } from '../hooks/useCancelSubscription';
import { usePayments } from '../hooks/usePayments';
import { useSubscribeToPlan } from '../hooks/useSubscribeToPlan';
import { useSubscriptionPlans } from '../hooks/useSubscriptionPlans';
import { useSubscriptionSummary } from '../hooks/useSubscriptionSummary';
import type { SubscriptionPlan } from '../types';

export type SubscriptionScreenProps = {
  onBack: () => void;
};

export function SubscriptionScreen({ onBack }: SubscriptionScreenProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();

  const summary = useSubscriptionSummary();
  const plans = useSubscriptionPlans();
  const payments = usePayments();
  const { subscribe, isSubscribing } = useSubscribeToPlan();
  const { cancel, isCancelling } = useCancelSubscription();

  const [pendingPlan, setPendingPlan] = useState<SubscriptionPlan | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const isLoading = summary.isLoading || plans.isLoading;
  const isError = summary.isError || plans.isError;
  const isRefetching = summary.isRefetching || plans.isRefetching || payments.isRefetching;
  const currentTier = summary.summary?.tier;
  const activeSubscription = summary.summary?.subscription ?? null;

  const retry = () => {
    summary.refetch();
    plans.refetch();
    payments.refetch();
  };
  const refreshControl = useRefreshControl(isRefetching, retry);

  const closeSubscribe = () => {
    if (!isSubscribing) {
      setPendingPlan(null);
    }
  };

  const confirmSubscribe = async () => {
    if (!pendingPlan) {
      return;
    }
    try {
      await subscribe({ tier: pendingPlan.tier });
      toast.show({
        message: t('tutor.subscription.subscribe.success', { plan: pendingPlan.name }),
        type: 'success',
      });
      setPendingPlan(null);
    } catch {
      toast.show({ message: t('tutor.subscription.subscribe.error'), type: 'error' });
    }
  };

  const closeCancel = () => {
    if (!isCancelling) {
      setConfirmingCancel(false);
    }
  };

  const confirmCancel = async () => {
    try {
      await cancel();
      toast.show({ message: t('tutor.subscription.cancel.success'), type: 'success' });
      setConfirmingCancel(false);
    } catch {
      toast.show({ message: t('tutor.subscription.cancel.error'), type: 'error' });
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.headerBar}>
        <Button
          label={t('common.back')}
          accessibilityLabel={t('common.back')}
          variant="ghost"
          size="compact"
          leadingIcon="arrow-left"
          onPress={onBack}
        />
        <Text variant="subtitle" numberOfLines={1} style={styles.headerTitle}>
          {t('tutor.subscription.title')}
        </Text>
      </View>

      {isLoading ? (
        <LoadingState label={t('common.loading')} />
      ) : isError ? (
        <ErrorState
          title={t('tutor.subscription.errorTitle')}
          description={t('tutor.subscription.errorDescription')}
          retryLabel={t('common.retry')}
          onRetry={retry}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          <Text variant="body" color="textSecondary">
            {t('tutor.subscription.subtitle')}
          </Text>

          {activeSubscription ? (
            <View style={styles.section}>
              <Text variant="subtitle">{t('tutor.subscription.currentTitle')}</Text>
              <CurrentSubscriptionCard
                subscription={activeSubscription}
                onCancel={() => setConfirmingCancel(true)}
                isCancelling={isCancelling}
              />
            </View>
          ) : null}

          <View style={styles.section}>
            {plans.plans.map((plan) => {
              const isCurrent = plan.tier === currentTier;
              const canSubscribe = !isCurrent && plan.tier !== 'FREE';
              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isCurrent={isCurrent}
                  isSubscribing={isSubscribing && pendingPlan?.id === plan.id}
                  onSubscribe={canSubscribe ? () => setPendingPlan(plan) : undefined}
                />
              );
            })}
          </View>

          {payments.payments.length > 0 ? (
            <View style={styles.section}>
              <Text variant="subtitle">{t('tutor.subscription.payments.title')}</Text>
              {payments.payments.map((payment) => (
                <PaymentRow key={payment.id} payment={payment} />
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}

      <Modal
        visible={pendingPlan !== null}
        onClose={closeSubscribe}
        title={t('tutor.subscription.subscribe.title', { plan: pendingPlan?.name ?? '' })}
      >
        <Text variant="body" color="textSecondary">
          {t('tutor.subscription.subscribe.message', {
            price: pendingPlan ? formatPrice(pendingPlan.priceMonthly, pendingPlan.currency) : '',
          })}
        </Text>
        <View style={styles.modalActions}>
          <Button
            label={t('common.cancel')}
            variant="outline"
            onPress={closeSubscribe}
            disabled={isSubscribing}
            style={styles.modalButton}
          />
          <Button
            label={t('tutor.subscription.subscribe.confirm')}
            variant="primary"
            onPress={() => void confirmSubscribe()}
            loading={isSubscribing}
            style={styles.modalButton}
          />
        </View>
      </Modal>

      <Modal
        visible={confirmingCancel}
        onClose={closeCancel}
        title={t('tutor.subscription.cancel.title')}
      >
        <Text variant="body" color="textSecondary">
          {t('tutor.subscription.cancel.message')}
        </Text>
        <View style={styles.modalActions}>
          <Button
            label={t('tutor.subscription.cancel.keep')}
            variant="outline"
            onPress={closeCancel}
            disabled={isCancelling}
            style={styles.modalButton}
          />
          <Button
            label={t('tutor.subscription.cancel.confirm')}
            variant="danger"
            onPress={() => void confirmCancel()}
            loading={isCancelling}
            style={styles.modalButton}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['5xl'],
    gap: spacing['2xl'],
  },
  section: {
    gap: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
