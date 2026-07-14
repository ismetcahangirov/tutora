/**
 * Platform-settings contracts (issue #70). Mirrors the API's `FeatureFlagView`
 * and `SystemSettingView` plus the admin write DTOs. Zod validates every backend
 * payload at the boundary; TypeScript types are inferred from the schemas. Dates
 * arrive as ISO strings over JSON, so date-bearing fields are typed as strings.
 */
import { z } from 'zod';

/**
 * Shared key format for flags and settings: a lowercase identifier of letters,
 * digits, and underscores starting with a letter (mirrors the API's
 * `CONFIG_KEY_PATTERN`).
 */
export const CONFIG_KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

/** Bounds mirrored from the API DTOs so the form fails fast at the boundary. */
export const KEY_MAX_LENGTH = 80;
export const DESCRIPTION_MAX_LENGTH = 200;
export const MIN_ROLLOUT = 0;
export const MAX_ROLLOUT = 100;

/** A feature flag: master switch plus a 0–100 rollout slice. */
export const featureFlagSchema = z.object({
  id: z.string(),
  key: z.string(),
  description: z.string().nullable(),
  enabled: z.boolean(),
  rolloutPercentage: z.number(),
  updatedById: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type FeatureFlag = z.infer<typeof featureFlagSchema>;

/** A system setting: a keyed, arbitrary-JSON global config entry. */
export const systemSettingSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.unknown(),
  description: z.string().nullable(),
  updatedById: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SystemSetting = z.infer<typeof systemSettingSchema>;

/** Body of `POST /admin/feature-flags`. `key` is the flag's immutable identity. */
export type CreateFeatureFlagBody = {
  key: string;
  description?: string;
  enabled?: boolean;
  rolloutPercentage?: number;
};

/** Body of `PATCH /admin/feature-flags/:id`. Every field optional; `key` fixed. */
export type UpdateFeatureFlagBody = {
  description?: string;
  enabled?: boolean;
  rolloutPercentage?: number;
};

/** Body of `POST /admin/settings`. `key` is the setting's immutable identity. */
export type CreateSystemSettingBody = {
  key: string;
  value: unknown;
  description?: string;
};

/** Body of `PATCH /admin/settings/:id`. Every field optional; `key` is fixed. */
export type UpdateSystemSettingBody = {
  value?: unknown;
  description?: string;
};

// --- Client-side form validation (mirrors the API DTO constraints) ----------

/** A flag/setting key: lowercase, letters/digits/underscores, within the cap. */
export const configKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(KEY_MAX_LENGTH)
  .regex(CONFIG_KEY_PATTERN);

/** Rollout percentage: a whole number between 0 and 100. */
export const rolloutSchema = z.number().int().min(MIN_ROLLOUT).max(MAX_ROLLOUT);

/** Optional description, within the API's length cap. */
export const descriptionSchema = z.string().trim().max(DESCRIPTION_MAX_LENGTH);
