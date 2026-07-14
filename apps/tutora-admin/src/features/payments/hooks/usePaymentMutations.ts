import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updatePaymentStatus } from '../api/payments.api';
import { paymentsKeys } from '../constants';
import type { UpdatePaymentStatusBody } from '../types';

/**
 * Settle or refund a payment. Invalidates the payments list so the row reflects
 * the new status (the linked subscription follows on the backend).
 */
export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatePaymentStatusBody }) =>
      updatePaymentStatus(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentsKeys.payments.all });
      // A refund/settlement can change the subscription's standing too.
      void queryClient.invalidateQueries({ queryKey: paymentsKeys.subscriptions.all });
    },
  });
}
