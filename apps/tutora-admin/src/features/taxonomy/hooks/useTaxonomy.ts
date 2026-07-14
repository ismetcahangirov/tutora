import { useQuery } from '@tanstack/react-query';

import { listTaxonomy } from '../api/taxonomy.api';
import { taxonomyKeys } from '../constants';
import type { TaxonomyKind } from '../types';

/** List query for a taxonomy kind. */
export function useTaxonomyQuery(kind: TaxonomyKind) {
  return useQuery({
    queryKey: taxonomyKeys.list(kind),
    queryFn: () => listTaxonomy(kind),
  });
}
