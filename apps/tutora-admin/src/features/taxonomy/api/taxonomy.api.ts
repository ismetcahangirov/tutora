/**
 * Taxonomy API (issue #65). One HTTP layer over the shared Axios client for all
 * four kinds; reads hit the public list routes, writes hit the admin routes.
 * Every response is validated at the boundary with Zod.
 */
import { apiClient } from '@shared/lib';

import { taxonomyListEndpoint, taxonomyWriteEndpoint } from '../constants';
import {
  parseTaxonomyItem,
  parseTaxonomyList,
  type TaxonomyItem,
  type TaxonomyKind,
  type TaxonomyWriteBody,
} from '../types';

/** List every item of a kind (reference data is small, so it's unpaginated). */
export async function listTaxonomy(kind: TaxonomyKind): Promise<TaxonomyItem[]> {
  const { data } = await apiClient.get<unknown>(taxonomyListEndpoint(kind));
  return parseTaxonomyList(kind, data);
}

export async function createTaxonomyItem(
  kind: TaxonomyKind,
  body: TaxonomyWriteBody,
): Promise<TaxonomyItem> {
  const { data } = await apiClient.post<unknown>(taxonomyWriteEndpoint(kind), body);
  return parseTaxonomyItem(kind, data);
}

export async function updateTaxonomyItem(
  kind: TaxonomyKind,
  id: string,
  body: TaxonomyWriteBody,
): Promise<TaxonomyItem> {
  const { data } = await apiClient.patch<unknown>(`${taxonomyWriteEndpoint(kind)}/${id}`, body);
  return parseTaxonomyItem(kind, data);
}

/** Delete an item. Returns 204 with no body. */
export async function deleteTaxonomyItem(kind: TaxonomyKind, id: string): Promise<void> {
  await apiClient.delete(`${taxonomyWriteEndpoint(kind)}/${id}`);
}
