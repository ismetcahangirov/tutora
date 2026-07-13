/**
 * Taxonomy feature — public barrel (student epic #40).
 *
 * Import reference-data hooks/types from here:
 *   `import { useSubjects, type Subject } from '@features/taxonomy';`
 */
export { useCategories, useSubjects, useDistricts, useLanguages } from './hooks/useTaxonomy';
export { taxonomyKeys, TAXONOMY_ENDPOINTS } from './constants';
export type { Category, Subject, District, Language } from './types';
