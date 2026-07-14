import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createTaxonomyItem, deleteTaxonomyItem, updateTaxonomyItem } from '../api/taxonomy.api';
import { taxonomyKeys } from '../constants';
import type { TaxonomyKind, TaxonomyWriteBody } from '../types';

/** Create an item of `kind`. Invalidates every kind so related names stay fresh. */
export function useCreateTaxonomyItem(kind: TaxonomyKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TaxonomyWriteBody) => createTaxonomyItem(kind, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taxonomyKeys.all }),
  });
}

/** Update an item of `kind`. */
export function useUpdateTaxonomyItem(kind: TaxonomyKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TaxonomyWriteBody }) =>
      updateTaxonomyItem(kind, id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taxonomyKeys.all }),
  });
}

/** Delete an item of `kind`. */
export function useDeleteTaxonomyItem(kind: TaxonomyKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTaxonomyItem(kind, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taxonomyKeys.all }),
  });
}
