import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createPlan, updatePlan } from '../api/payments.api';
import { paymentsKeys } from '../constants';
import type { CreatePlanBody, UpdatePlanBody } from '../types';

/** Create a plan. Invalidates the catalogue so the new plan appears. */
export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePlanBody) => createPlan(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: paymentsKeys.plans }),
  });
}

/** Update a plan. Invalidates the catalogue so the row reflects the change. */
export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatePlanBody }) => updatePlan(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: paymentsKeys.plans }),
  });
}
