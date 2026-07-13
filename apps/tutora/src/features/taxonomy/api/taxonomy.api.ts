/**
 * taxonomy API — fetch reference lists via the shared client (student epic #40).
 *
 * All four endpoints are public (no bearer required) and return plain arrays (no
 * pagination envelope). The shared Axios client is still used so there is one HTTP
 * layer across the app.
 */
import { apiClient } from '@/shared/lib';

import { TAXONOMY_ENDPOINTS } from '../constants';
import type { Category, District, Language, Subject } from '../types';

/** GET all categories, alphabetized by the backend. */
export async function fetchCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>(TAXONOMY_ENDPOINTS.categories);
  return data;
}

/** GET subjects, optionally scoped to a single category. */
export async function fetchSubjects(categoryId?: string): Promise<Subject[]> {
  const { data } = await apiClient.get<Subject[]>(TAXONOMY_ENDPOINTS.subjects, {
    params: categoryId ? { categoryId } : undefined,
  });
  return data;
}

/** GET all districts. */
export async function fetchDistricts(): Promise<District[]> {
  const { data } = await apiClient.get<District[]>(TAXONOMY_ENDPOINTS.districts);
  return data;
}

/** GET all languages of instruction. */
export async function fetchLanguages(): Promise<Language[]> {
  const { data } = await apiClient.get<Language[]>(TAXONOMY_ENDPOINTS.languages);
  return data;
}
