import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createFeatureFlag,
  deleteFeatureFlag,
  listFeatureFlags,
  updateFeatureFlag,
} from '../api/settings.api';
import { settingsKeys } from '../constants';
import type { CreateFeatureFlagBody, UpdateFeatureFlagBody } from '../types';

/** Feature-flag catalogue query. Small and rarely changing, so it is cached. */
export function useFeatureFlagsQuery() {
  return useQuery({
    queryKey: settingsKeys.flags,
    queryFn: listFeatureFlags,
  });
}

/** Create a flag, then refresh the list. */
export function useCreateFeatureFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateFeatureFlagBody) => createFeatureFlag(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.flags }),
  });
}

/** Update a flag, then refresh the list. */
export function useUpdateFeatureFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateFeatureFlagBody }) =>
      updateFeatureFlag(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.flags }),
  });
}

/** Delete a flag, then refresh the list. */
export function useDeleteFeatureFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFeatureFlag(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.flags }),
  });
}
