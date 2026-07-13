/**
 * Taxonomy feature — endpoints, query keys, and cache policy (student epic #40).
 */

/** Public taxonomy endpoints, appended to `EXPO_PUBLIC_API_URL`. */
export const TAXONOMY_ENDPOINTS = {
  categories: '/api/v1/categories',
  subjects: '/api/v1/subjects',
  districts: '/api/v1/districts',
  languages: '/api/v1/languages',
} as const;

/**
 * Reference data is cached for an hour on the server and changes rarely, so the
 * client mirrors that: keep it fresh for an hour before considering a refetch.
 */
export const TAXONOMY_STALE_TIME = 60 * 60_000;

/**
 * Structured, stable query keys so caches are shared and invalidated precisely.
 * `subjects` is parameterized by the optional category filter.
 */
export const taxonomyKeys = {
  all: ['taxonomy'] as const,
  categories: () => [...taxonomyKeys.all, 'categories'] as const,
  subjects: (categoryId?: string) => [...taxonomyKeys.all, 'subjects', categoryId ?? null] as const,
  districts: () => [...taxonomyKeys.all, 'districts'] as const,
  languages: () => [...taxonomyKeys.all, 'languages'] as const,
};
