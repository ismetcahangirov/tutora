import { useQuery } from '@tanstack/react-query';

import { listPlans } from '../api/payments.api';
import { paymentsKeys } from '../constants';

/** Plan catalogue query. The list is small and rarely changes, so it is cached. */
export function usePlansQuery() {
  return useQuery({
    queryKey: paymentsKeys.plans,
    queryFn: listPlans,
  });
}
