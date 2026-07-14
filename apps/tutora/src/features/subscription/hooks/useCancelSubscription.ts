/**
 * useCancelSubscription — cancel the caller's subscription at period end (#58).
 *
 * Access continues until `currentPeriodEnd`; the status flips to CANCELED. On
 * success we invalidate the whole subscription prefix so the summary reflects the
 * canceled standing. `cancel` resolves with the updated subscription (or rejects)
 * so the screen can toast on the outcome.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cancelSubscription } from '../api/subscription.api';
import { subscriptionKeys } from '../constants';
import type { Subscription } from '../types';

export type UseCancelSubscriptionResult = {
  cancel: () => Promise<Subscription>;
  isCancelling: boolean;
};

export function useCancelSubscription(): UseCancelSubscriptionResult {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => cancelSubscription(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });

  return { cancel: mutation.mutateAsync, isCancelling: mutation.isPending };
}
