/**
 * taxonomy API (#40) — endpoints and the optional subject category filter.
 */
import { apiClient } from '@/shared/lib';
import { TAXONOMY_ENDPOINTS } from '@features/taxonomy/constants';

import {
  fetchCategories,
  fetchCities,
  fetchDistricts,
  fetchLanguages,
  fetchSubjects,
} from '../taxonomy.api';

jest.mock('@/shared/lib', () => ({
  apiClient: { get: jest.fn() },
}));

const mockedGet = apiClient.get as jest.Mock;

describe('taxonomy API (#40)', () => {
  it('fetches categories from the categories endpoint', async () => {
    mockedGet.mockResolvedValueOnce({ data: [] });
    await fetchCategories();
    expect(mockedGet).toHaveBeenCalledWith(TAXONOMY_ENDPOINTS.categories);
  });

  it('fetches all subjects with no params when no category is given', async () => {
    mockedGet.mockResolvedValueOnce({ data: [] });
    await fetchSubjects();
    expect(mockedGet).toHaveBeenCalledWith(TAXONOMY_ENDPOINTS.subjects, { params: undefined });
  });

  it('scopes subjects to a category when given', async () => {
    mockedGet.mockResolvedValueOnce({ data: [] });
    await fetchSubjects('cat-1');
    expect(mockedGet).toHaveBeenCalledWith(TAXONOMY_ENDPOINTS.subjects, {
      params: { categoryId: 'cat-1' },
    });
  });

  it('fetches cities and languages', async () => {
    mockedGet.mockResolvedValue({ data: [] });
    await fetchCities();
    await fetchLanguages();
    expect(mockedGet).toHaveBeenCalledWith(TAXONOMY_ENDPOINTS.cities);
    expect(mockedGet).toHaveBeenCalledWith(TAXONOMY_ENDPOINTS.languages);
  });

  it('fetches all districts with no params when no city is given', async () => {
    mockedGet.mockResolvedValueOnce({ data: [] });
    await fetchDistricts();
    expect(mockedGet).toHaveBeenCalledWith(TAXONOMY_ENDPOINTS.districts, { params: undefined });
  });

  it('scopes districts to a city when given', async () => {
    mockedGet.mockResolvedValueOnce({ data: [] });
    await fetchDistricts('city-1');
    expect(mockedGet).toHaveBeenCalledWith(TAXONOMY_ENDPOINTS.districts, {
      params: { cityId: 'city-1' },
    });
  });
});
