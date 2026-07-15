/**
 * Translations feature contracts (issue #85). Mirrors the API's
 * `TranslationView` and the admin write DTOs. Zod validates every backend
 * payload at the boundary; TypeScript types are inferred from the schemas. Dates
 * arrive as ISO strings.
 */
import { z } from 'zod';

/** Locale a new key defaults its namespace to (mirrors the API's default). */
export const DEFAULT_FORM_NAMESPACE = 'common';

/**
 * Namespace format: a single alphanumeric word starting with a letter (mirrors
 * the API's `TRANSLATION_NAMESPACE_PATTERN`).
 */
export const NAMESPACE_PATTERN = /^[a-zA-Z][a-zA-Z0-9]*$/;

/**
 * Key format: dot- or underscore-joined alphanumeric segments (mirrors the
 * API's `TRANSLATION_KEY_PATTERN`), e.g. `filter.district`.
 */
export const KEY_PATTERN = /^[a-zA-Z0-9]+(?:[._][a-zA-Z0-9]+)*$/;

/** Bounds mirrored from the API DTOs so the form fails fast at the boundary. */
export const NAMESPACE_MAX_LENGTH = 60;
export const KEY_MAX_LENGTH = 160;
export const DESCRIPTION_MAX_LENGTH = 300;
export const VALUE_MAX_LENGTH = 2000;

/** Per-locale copy for a key — every locale optional (mirrors az/en/ru). */
export const translationValuesSchema = z.object({
  az: z.string().optional(),
  en: z.string().optional(),
  ru: z.string().optional(),
});
export type TranslationValues = z.infer<typeof translationValuesSchema>;

/** A managed translation key — the full editable record. */
export const translationSchema = z.object({
  id: z.string(),
  namespace: z.string(),
  key: z.string(),
  description: z.string().nullable(),
  values: translationValuesSchema,
  updatedById: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Translation = z.infer<typeof translationSchema>;

/** Query parameters for the paginated admin translations list. */
export type ListTranslationsParams = {
  page: number;
  limit: number;
  namespace?: string;
  q?: string;
};

/** Body of `POST /admin/translations`. `namespace` + `key` are the identity. */
export type CreateTranslationBody = {
  namespace: string;
  key: string;
  description?: string;
  values?: TranslationValues;
};

/** Body of `PATCH /admin/translations/:id`. `namespace`/`key` are immutable. */
export type UpdateTranslationBody = {
  description?: string;
  values?: TranslationValues;
};

// --- Client-side form validation (mirrors the API DTO constraints) ----------

/** A namespace: one alphanumeric word, within the length cap. */
export const namespaceSchema = z
  .string()
  .trim()
  .min(1)
  .max(NAMESPACE_MAX_LENGTH)
  .regex(NAMESPACE_PATTERN);

/** A key: dot/underscore-joined alphanumeric segments, within the cap. */
export const keySchema = z.string().trim().min(1).max(KEY_MAX_LENGTH).regex(KEY_PATTERN);

/** Optional description, within the cap. */
export const descriptionSchema = z.string().trim().max(DESCRIPTION_MAX_LENGTH);

/** A single localized value, within the cap. */
export const valueSchema = z.string().max(VALUE_MAX_LENGTH);
