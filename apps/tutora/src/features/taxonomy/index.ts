/**
 * Taxonomy feature — public barrel (student epic #40).
 *
 * Import reference-data hooks/types from here:
 *   `import { useSubjects, type Subject } from '@features/taxonomy';`
 */
export {
  useCategories,
  useSubjects,
  useCities,
  useDistricts,
  useLanguages,
} from './hooks/useTaxonomy';
export { taxonomyKeys, TAXONOMY_ENDPOINTS } from './constants';
export type { Category, Subject, City, District, Language } from './types';
