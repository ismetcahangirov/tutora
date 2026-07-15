import type { Prisma, Translation } from '@prisma/client';
import { SUPPORTED_LANGUAGES } from '@/i18n/i18n.config';

/**
 * Namespace format (#85): a single alphanumeric word starting with a letter
 * (e.g. `common`, `search`, `auth`). Groups related keys and, joined with the
 * key, forms the effective public identifier `namespace.key`.
 */
export const TRANSLATION_NAMESPACE_PATTERN = /^[a-zA-Z][a-zA-Z0-9]*$/;

/**
 * Key format (#85): dot- or underscore-joined alphanumeric segments
 * (e.g. `filter.district`, `errors.not_authorized`). Mirrors the dot-namespaced
 * i18n keys the apps already use and is the single source of truth for the DTO
 * `@Matches` guard.
 */
export const TRANSLATION_KEY_PATTERN = /^[a-zA-Z0-9]+(?:[._][a-zA-Z0-9]+)*$/;

/** The locales a translation can carry a value for (epic #81: az/en/ru). */
export type TranslationLocale = (typeof SUPPORTED_LANGUAGES)[number];

/** Per-locale copy for a key — partial, so a key can be completed over time. */
export type TranslationValues = Partial<Record<TranslationLocale, string>>;

/** A flat `namespace.key → value` map for one locale, consumed by clients. */
export type LocaleTranslationsMap = Record<string, string>;

/** All locales' maps, keyed by locale, as served when no locale is requested. */
export type PublicTranslationsMap = Record<TranslationLocale, LocaleTranslationsMap>;

/** Admin-facing projection of a translation — the full editable record. */
export interface TranslationView {
  id: string;
  namespace: string;
  key: string;
  description: string | null;
  values: TranslationValues;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Narrows the stored JSON to a {@link TranslationValues}: keeps only supported
 * locales whose value is a non-empty string, dropping anything malformed. The
 * column is admin-written JSON, so this is the trust boundary on read.
 */
export function toTranslationValues(value: Prisma.JsonValue | null): TranslationValues {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const result: TranslationValues = {};
  for (const locale of SUPPORTED_LANGUAGES) {
    const localized = source[locale];
    if (typeof localized === 'string' && localized.length > 0) {
      result[locale] = localized;
    }
  }
  return result;
}

/** Maps a `Translation` row to its admin view. */
export function toTranslationView(row: Translation): TranslationView {
  return {
    id: row.id,
    namespace: row.namespace,
    key: row.key,
    description: row.description,
    values: toTranslationValues(row.values),
    updatedById: row.updatedById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** The effective public identifier for a translation: `namespace.key`. */
export function toPublicKey(namespace: string, key: string): string {
  return `${namespace}.${key}`;
}
