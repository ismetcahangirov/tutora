/**
 * Taxonomy management contracts (issue #65). Reference data the marketplace
 * depends on: categories, subjects, districts, and languages. The four entities
 * are near-identical CRUD, so this feature is config-driven: one set of
 * components renders every kind from a small per-kind config. Zod validates each
 * backend payload at the boundary; validation rules mirror the API's DTOs.
 */
import { z } from 'zod';

/** The four taxonomy entities the admin manages. */
export const TAXONOMY_KINDS = ['categories', 'subjects', 'districts', 'languages'] as const;
export type TaxonomyKind = (typeof TAXONOMY_KINDS)[number];

/** A lowercase, url-safe slug (mirrors the API's `SLUG_PATTERN`). */
export const SLUG_PATTERN = /^[a-z0-9-]+$/;
/** A lowercase language code such as `az`, `en`, `ru` (mirrors the API). */
export const LANGUAGE_CODE_PATTERN = /^[a-z]{2,10}$/;

export const NAME_MAX_LENGTH = 120;
export const SLUG_MAX_LENGTH = 120;

/** The secondary identifier a kind carries: a slug, or a language code. */
export type SecondaryField = 'slug' | 'code';

const categorySchema = z.object({ id: z.string(), name: z.string(), slug: z.string() });
const subjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  categoryId: z.string().nullable(),
});
const districtSchema = z.object({ id: z.string(), name: z.string(), slug: z.string() });
const languageSchema = z.object({ id: z.string(), name: z.string(), code: z.string() });

const ITEM_SCHEMAS = {
  categories: categorySchema,
  subjects: subjectSchema,
  districts: districtSchema,
  languages: languageSchema,
} as const;

/**
 * A taxonomy row, normalised across kinds: `slug` and `code` are mutually
 * exclusive (a kind has one or the other) and `categoryId` is present only for
 * subjects. The generic table and form read whichever fields the kind's config
 * declares.
 */
export type TaxonomyItem = {
  id: string;
  name: string;
  slug?: string;
  code?: string;
  categoryId?: string | null;
};

/** Per-kind UI config: which secondary field it has and whether it owns a category. */
export type TaxonomyKindConfig = {
  field: SecondaryField;
  hasCategory: boolean;
};

export const TAXONOMY_CONFIGS: Record<TaxonomyKind, TaxonomyKindConfig> = {
  categories: { field: 'slug', hasCategory: false },
  subjects: { field: 'slug', hasCategory: true },
  districts: { field: 'slug', hasCategory: false },
  languages: { field: 'code', hasCategory: false },
};

/** Validate + parse a list payload for `kind`. The upcast widens to the superset. */
export function parseTaxonomyList(kind: TaxonomyKind, data: unknown): TaxonomyItem[] {
  return z.array(ITEM_SCHEMAS[kind]).parse(data) as TaxonomyItem[];
}

/** Validate + parse a single-item payload for `kind`. */
export function parseTaxonomyItem(kind: TaxonomyKind, data: unknown): TaxonomyItem {
  return ITEM_SCHEMAS[kind].parse(data) as TaxonomyItem;
}

/** Field-level schemas for the create/edit form. */
export const nameSchema = z.string().trim().min(1).max(NAME_MAX_LENGTH);
export const slugSchema = z.string().trim().min(1).max(SLUG_MAX_LENGTH).regex(SLUG_PATTERN);
export const codeSchema = z.string().trim().regex(LANGUAGE_CODE_PATTERN);

/** Create/update payload. Only the fields a kind uses are populated. */
export type TaxonomyWriteBody = {
  name: string;
  slug?: string;
  code?: string;
  categoryId?: string | null;
};
