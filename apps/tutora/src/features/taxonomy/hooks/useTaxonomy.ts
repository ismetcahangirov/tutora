/**
 * Taxonomy query hooks (student epic #40).
 *
 * Thin React Query wrappers over the reference-data endpoints. Reference data is
 * long-lived, so every query shares the same generous `staleTime` and structured
 * key. Screens consume these for filter options (subjects/districts/languages)
 * and the home categories; the cache is shared so opening the filter sheet twice
 * hits the network once.
 */
import { useQuery } from '@tanstack/react-query';

import {
  fetchCategories,
  fetchDistricts,
  fetchLanguages,
  fetchSubjects,
} from '../api/taxonomy.api';
import { TAXONOMY_STALE_TIME, taxonomyKeys } from '../constants';

export function useCategories() {
  return useQuery({
    queryKey: taxonomyKeys.categories(),
    queryFn: fetchCategories,
    staleTime: TAXONOMY_STALE_TIME,
  });
}

export function useSubjects(categoryId?: string) {
  return useQuery({
    queryKey: taxonomyKeys.subjects(categoryId),
    queryFn: () => fetchSubjects(categoryId),
    staleTime: TAXONOMY_STALE_TIME,
  });
}

export function useDistricts() {
  return useQuery({
    queryKey: taxonomyKeys.districts(),
    queryFn: fetchDistricts,
    staleTime: TAXONOMY_STALE_TIME,
  });
}

export function useLanguages() {
  return useQuery({
    queryKey: taxonomyKeys.languages(),
    queryFn: fetchLanguages,
    staleTime: TAXONOMY_STALE_TIME,
  });
}
