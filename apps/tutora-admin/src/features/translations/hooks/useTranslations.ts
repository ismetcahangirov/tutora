import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createTranslation,
  deleteTranslation,
  listTranslations,
  updateTranslation,
} from '../api/translations.api';
import { translationKeys } from '../constants';
import type {
  CreateTranslationBody,
  ListTranslationsParams,
  UpdateTranslationBody,
} from '../types';

/**
 * Paginated translations query. `keepPreviousData` holds the current page on
 * screen while the next page or a changed filter loads, so paging never flashes
 * empty.
 */
export function useTranslationsQuery(params: ListTranslationsParams) {
  return useQuery({
    queryKey: translationKeys.list(params),
    queryFn: () => listTranslations(params),
    placeholderData: keepPreviousData,
  });
}

/** Create a key, then refresh every translations list. */
export function useCreateTranslation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTranslationBody) => createTranslation(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: translationKeys.all }),
  });
}

/** Update a key, then refresh every translations list. */
export function useUpdateTranslation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTranslationBody }) =>
      updateTranslation(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: translationKeys.all }),
  });
}

/** Delete a key, then refresh every translations list. */
export function useDeleteTranslation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTranslation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: translationKeys.all }),
  });
}
