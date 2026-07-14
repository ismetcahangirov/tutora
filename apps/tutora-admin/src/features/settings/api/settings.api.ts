/**
 * Platform-settings API (issue #70). Uses the shared Axios client; every
 * response is validated at the boundary with Zod. Backed by the API's
 * `admin/feature-flags` and `admin/settings` controllers.
 */
import { apiClient } from '@shared/lib';

import { ADMIN_FEATURE_FLAGS_ENDPOINT, ADMIN_SETTINGS_ENDPOINT } from '../constants';
import {
  featureFlagSchema,
  systemSettingSchema,
  type CreateFeatureFlagBody,
  type CreateSystemSettingBody,
  type FeatureFlag,
  type SystemSetting,
  type UpdateFeatureFlagBody,
  type UpdateSystemSettingBody,
} from '../types';

const flagsSchema = featureFlagSchema.array();
const settingsSchema = systemSettingSchema.array();

/** List every feature flag. */
export async function listFeatureFlags(): Promise<FeatureFlag[]> {
  const { data } = await apiClient.get<unknown>(ADMIN_FEATURE_FLAGS_ENDPOINT);
  return flagsSchema.parse(data);
}

/** Create a feature flag. */
export async function createFeatureFlag(body: CreateFeatureFlagBody): Promise<FeatureFlag> {
  const { data } = await apiClient.post<unknown>(ADMIN_FEATURE_FLAGS_ENDPOINT, body);
  return featureFlagSchema.parse(data);
}

/** Update a flag's toggle, rollout, or description. */
export async function updateFeatureFlag(
  id: string,
  body: UpdateFeatureFlagBody,
): Promise<FeatureFlag> {
  const { data } = await apiClient.patch<unknown>(`${ADMIN_FEATURE_FLAGS_ENDPOINT}/${id}`, body);
  return featureFlagSchema.parse(data);
}

/** Delete a feature flag. */
export async function deleteFeatureFlag(id: string): Promise<void> {
  await apiClient.delete(`${ADMIN_FEATURE_FLAGS_ENDPOINT}/${id}`);
}

/** List every system setting. */
export async function listSystemSettings(): Promise<SystemSetting[]> {
  const { data } = await apiClient.get<unknown>(ADMIN_SETTINGS_ENDPOINT);
  return settingsSchema.parse(data);
}

/** Create a system setting. */
export async function createSystemSetting(body: CreateSystemSettingBody): Promise<SystemSetting> {
  const { data } = await apiClient.post<unknown>(ADMIN_SETTINGS_ENDPOINT, body);
  return systemSettingSchema.parse(data);
}

/** Update a setting's value and/or description. */
export async function updateSystemSetting(
  id: string,
  body: UpdateSystemSettingBody,
): Promise<SystemSetting> {
  const { data } = await apiClient.patch<unknown>(`${ADMIN_SETTINGS_ENDPOINT}/${id}`, body);
  return systemSettingSchema.parse(data);
}

/** Delete a system setting. */
export async function deleteSystemSetting(id: string): Promise<void> {
  await apiClient.delete(`${ADMIN_SETTINGS_ENDPOINT}/${id}`);
}
