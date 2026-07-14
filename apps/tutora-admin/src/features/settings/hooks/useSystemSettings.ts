import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createSystemSetting,
  deleteSystemSetting,
  listSystemSettings,
  updateSystemSetting,
} from '../api/settings.api';
import { settingsKeys } from '../constants';
import type { CreateSystemSettingBody, UpdateSystemSettingBody } from '../types';

/** System-settings catalogue query. Small and rarely changing, so it is cached. */
export function useSystemSettingsQuery() {
  return useQuery({
    queryKey: settingsKeys.settings,
    queryFn: listSystemSettings,
  });
}

/** Create a setting, then refresh the list. */
export function useCreateSystemSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSystemSettingBody) => createSystemSetting(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.settings }),
  });
}

/** Update a setting, then refresh the list. */
export function useUpdateSystemSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateSystemSettingBody }) =>
      updateSystemSetting(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.settings }),
  });
}

/** Delete a setting, then refresh the list. */
export function useDeleteSystemSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSystemSetting(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.settings }),
  });
}
