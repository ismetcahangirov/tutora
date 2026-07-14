/**
 * usePayments — the caller's payment history for the subscription screen (#58).
 *
 * The first page is plenty for a personal history; each entry carries its status
 * so the tutor sees whether a charge is pending, paid, failed or refunded.
 */
import { useQuery } from '@tanstack/react-query';

import { getPayments } from '../api/subscription.api';
import { PAYMENTS_PAGE_SIZE, subscriptionKeys } from '../constants';
import type { Payment } from '../types';

export type UsePaymentsResult = {
  payments: Payment[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  refetch: () => void;
};

export function usePayments(limit: number = PAYMENTS_PAGE_SIZE): UsePaymentsResult {
  const query = useQuery({
    queryKey: subscriptionKeys.payments(limit),
    queryFn: () => getPayments(1, limit),
  });

  return {
    payments: query.data?.data ?? [],
    total: query.data?.meta.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    isRefetching: query.isRefetching,
    refetch: () => void query.refetch(),
  };
}
