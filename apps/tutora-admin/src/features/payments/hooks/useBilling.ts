import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { listPayments, listSubscriptions } from '../api/payments.api';
import { paymentsKeys } from '../constants';
import type { ListPaymentsParams, ListSubscriptionsParams } from '../types';

/** Subscriptions list query. Keeps the current page while the next one loads. */
export function useSubscriptionsQuery(params: ListSubscriptionsParams) {
  return useQuery({
    queryKey: paymentsKeys.subscriptions.list(params),
    queryFn: () => listSubscriptions(params),
    placeholderData: keepPreviousData,
  });
}

/** Payments/transactions list query. Keeps the current page while loading. */
export function usePaymentsQuery(params: ListPaymentsParams) {
  return useQuery({
    queryKey: paymentsKeys.payments.list(params),
    queryFn: () => listPayments(params),
    placeholderData: keepPreviousData,
  });
}
