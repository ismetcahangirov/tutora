/**
 * Search-filter derivation (student epic #40, #43).
 *
 * The filter sheet is chip-based (`FilterSelection` = section key → selected
 * values). This pure function projects that selection plus the debounced query
 * into the typed `TutorSearchParams` the API expects — parsing the encoded price
 * range and numeric rating, and picking the single value for single-select
 * sections. Pure and self-contained so it is unit-testable without a screen.
 */
import type { FilterSelection } from '@/components/ui';

import type { LessonFormat, TutorSearchParams, TutorSort } from './types';

/** Section keys shared by the filter sheet config and this deriver. */
export const FILTER_KEYS = {
  subject: 'subject',
  district: 'district',
  language: 'language',
  format: 'format',
  price: 'price',
  rating: 'rating',
  sort: 'sort',
} as const;

/** Price range chips encode `"min-max"`; an open end is empty (e.g. `"60-"`). */
export const PRICE_RANGES = [
  { value: '0-20' },
  { value: '20-40' },
  { value: '40-60' },
  { value: '60-' },
] as const;

/** Minimum-rating chips. */
export const RATING_THRESHOLDS = ['4.5', '4', '3.5'] as const;

function first(selection: FilterSelection, key: string): string | undefined {
  return selection[key]?.[0];
}

/** Parse a `"min-max"` price chip into `{ minPrice, maxPrice }`. */
function parsePriceRange(
  value: string | undefined,
): Pick<TutorSearchParams, 'minPrice' | 'maxPrice'> {
  if (!value) {
    return {};
  }
  const [min, max] = value.split('-');
  return {
    minPrice: min ? Number(min) : undefined,
    maxPrice: max ? Number(max) : undefined,
  };
}

/**
 * Build API search params from the current chip selection and free-text query.
 * Empty/omitted values are simply not included, so the request carries only
 * active filters.
 */
export function deriveSearchParams(selection: FilterSelection, query: string): TutorSearchParams {
  const trimmed = query.trim();
  const rating = first(selection, FILTER_KEYS.rating);
  const params: TutorSearchParams = {
    q: trimmed || undefined,
    subjectId: first(selection, FILTER_KEYS.subject),
    districtId: first(selection, FILTER_KEYS.district),
    languageId: first(selection, FILTER_KEYS.language),
    format: first(selection, FILTER_KEYS.format) as LessonFormat | undefined,
    minRating: rating ? Number(rating) : undefined,
    sort: (first(selection, FILTER_KEYS.sort) as TutorSort | undefined) ?? undefined,
    ...parsePriceRange(first(selection, FILTER_KEYS.price)),
  };
  return params;
}

/** Count the active filter sections (drives the "filters • N" badge). */
export function countActiveFilters(selection: FilterSelection): number {
  return Object.values(selection).filter((values) => values.length > 0).length;
}
