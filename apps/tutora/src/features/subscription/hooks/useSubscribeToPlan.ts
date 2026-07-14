/**
 * useSubscribeToPlan — subscribe the caller to a plan by tier (#58).
 *
 * The endpoint returns only the new subscription (not the full entitlement
 * summary), so on success we invalidate the whole subscription prefix — the
 * summary, plan states and payment history all re-read from source. `subscribe`
 * resolves with the created subscription (or rejects) so the screen can toast on
 * the outcome.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { subscribeToPlan } from '../api/subscription.api';
import { subscriptionKeys } from '../constants';
import type { Subscription, SubscribeInput } from '../types';

export type UseSubscribeToPlanResult = {
  subscribe: (input: SubscribeInput) => Promise<Subscription>;
  isSubscribing: boolean;
};

export function useSubscribeToPlan(): UseSubscribeToPlanResult {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: SubscribeInput) => subscribeToPlan(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });

  return { subscribe: mutation.mutateAsync, isSubscribing: mutation.isPending };
}
