/**
 * useSubscriptionPlans — the public catalogue of active plans (#58).
 *
 * The catalogue is small and rarely changes, so a single query serves the whole
 * screen. Exposes a typed, named-field API with the list defaulting to empty until
 * the fetch resolves.
 */
import { useQuery } from '@tanstack/react-query';

import { getSubscriptionPlans } from '../api/subscription.api';
import { subscriptionKeys } from '../constants';
import type { SubscriptionPlan } from '../types';

export type UseSubscriptionPlansResult = {
  plans: SubscriptionPlan[];
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  refetch: () => void;
};

export function useSubscriptionPlans(): UseSubscriptionPlansResult {
  const query = useQuery({
    queryKey: subscriptionKeys.plans(),
    queryFn: getSubscriptionPlans,
  });

  return {
    plans: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    isRefetching: query.isRefetching,
    refetch: () => void query.refetch(),
  };
}
