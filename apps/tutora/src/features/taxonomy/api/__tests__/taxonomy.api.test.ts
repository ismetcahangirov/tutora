/**
 * taxonomy API (#40) — endpoints and the optional subject category filter.
 */
import { apiClient } from '@/shared/lib';
import { TAXONOMY_ENDPOINTS } from '@features/taxonomy/constants';

import { fetchCategories, fetchDistricts, fetchLanguages, fetchSubjects } from '../taxonomy.api';

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

  it('fetches districts and languages', async () => {
    mockedGet.mockResolvedValue({ data: [] });
    await fetchDistricts();
    await fetchLanguages();
    expect(mockedGet).toHaveBeenCalledWith(TAXONOMY_ENDPOINTS.districts);
    expect(mockedGet).toHaveBeenCalledWith(TAXONOMY_ENDPOINTS.languages);
  });
});
