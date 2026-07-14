import { API_PREFIX } from '@shared/lib';

import type { TaxonomyKind } from './types';

/** Public read endpoint for a kind — the route name matches the kind exactly. */
export function taxonomyListEndpoint(kind: TaxonomyKind): string {
  return `${API_PREFIX}/${kind}`;
}

/** Admin write endpoint base for a kind. */
export function taxonomyWriteEndpoint(kind: TaxonomyKind): string {
  return `${API_PREFIX}/admin/taxonomy/${kind}`;
}

/**
 * Query keys. Invalidating `all` refreshes every kind — a single call keeps the
 * subjects' category names correct after a category edit.
 */
export const taxonomyKeys = {
  all: ['admin', 'taxonomy'] as const,
  list: (kind: TaxonomyKind) => ['admin', 'taxonomy', kind] as const,
};
