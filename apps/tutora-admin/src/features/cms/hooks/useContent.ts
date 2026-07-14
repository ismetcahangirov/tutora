import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createContent, deleteContent, listContent, updateContent } from '../api/cms.api';
import { contentKeys } from '../constants';
import type { CreateContentBody, ListContentParams, UpdateContentBody } from '../types';

/**
 * Paginated content query. `keepPreviousData` holds the current page on screen
 * while the next page or a changed filter loads, so paging never flashes empty.
 */
export function useContentQuery(params: ListContentParams) {
  return useQuery({
    queryKey: contentKeys.list(params),
    queryFn: () => listContent(params),
    placeholderData: keepPreviousData,
  });
}

/** Create an entry, then refresh every content list. */
export function useCreateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateContentBody) => createContent(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contentKeys.all }),
  });
}

/** Update an entry, then refresh every content list. */
export function useUpdateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateContentBody }) => updateContent(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contentKeys.all }),
  });
}

/** Delete an entry, then refresh every content list. */
export function useDeleteContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteContent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contentKeys.all }),
  });
}
