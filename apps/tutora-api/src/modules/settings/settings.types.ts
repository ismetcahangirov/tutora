import type { FeatureFlag, Prisma, SystemSetting } from '@prisma/client';

/**
 * Shared key format for feature flags and system settings: a lowercase
 * identifier of letters, digits, and underscores, starting with a letter
 * (e.g. `in_app_payments`). Kept here as the single source of truth for both
 * the DTO `@Matches` guards and any consumer that needs to validate a key.
 */
export const CONFIG_KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

/** Admin-facing projection of a feature flag. */
export interface FeatureFlagView {
  id: string;
  key: string;
  description: string | null;
  enabled: boolean;
  rolloutPercentage: number;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Admin-facing projection of a system setting. */
export interface SystemSettingView {
  id: string;
  key: string;
  value: Prisma.JsonValue;
  description: string | null;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Maps a `FeatureFlag` row to its admin view. */
export function toFeatureFlagView(flag: FeatureFlag): FeatureFlagView {
  return {
    id: flag.id,
    key: flag.key,
    description: flag.description,
    enabled: flag.enabled,
    rolloutPercentage: flag.rolloutPercentage,
    updatedById: flag.updatedById,
    createdAt: flag.createdAt,
    updatedAt: flag.updatedAt,
  };
}

/** Maps a `SystemSetting` row to its admin view. */
export function toSystemSettingView(setting: SystemSetting): SystemSettingView {
  return {
    id: setting.id,
    key: setting.key,
    value: setting.value,
    description: setting.description,
    updatedById: setting.updatedById,
    createdAt: setting.createdAt,
    updatedAt: setting.updatedAt,
  };
}
