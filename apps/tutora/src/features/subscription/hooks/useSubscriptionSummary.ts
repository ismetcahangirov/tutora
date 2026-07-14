/**
 * useSubscriptionSummary — the caller's current subscription + entitlements (#58).
 *
 * A single per-user resource read from `GET /billing/subscription`; the screen
 * derives the current tier, active subscription and included features from it.
 * Subscribe/cancel mutations invalidate this key so it always reflects the latest
 * standing.
 */
import { useQuery } from '@tanstack/react-query';

import { getSubscriptionSummary } from '../api/subscription.api';
import { subscriptionKeys } from '../constants';
import type { EntitlementSummary } from '../types';

export type UseSubscriptionSummaryResult = {
  summary: EntitlementSummary | undefined;
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  refetch: () => void;
};

export function useSubscriptionSummary(): UseSubscriptionSummaryResult {
  const query = useQuery({
    queryKey: subscriptionKeys.summary(),
    queryFn: getSubscriptionSummary,
  });

  return {
    summary: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isRefetching: query.isRefetching,
    refetch: () => void query.refetch(),
  };
}
