/**
 * tutors API (#40, #43/#44) — the shared client is mocked; we assert the request
 * shape (param stripping), the typed responses, and 404 → TutorNotFoundError.
 */
import { AxiosError, AxiosHeaders } from 'axios';

import { apiClient } from '@/shared/lib';
import type { Paginated } from '@/shared';
import { TUTOR_ENDPOINTS } from '@features/tutors/constants';
import type { TutorSummary } from '@features/tutors/types';
import { tutorProfile, tutorSummary } from '@features/tutors/__tests__/fixtures';

import { getTutorById, searchTutors, TutorNotFoundError } from '../tutors.api';

jest.mock('@/shared/lib', () => ({
  apiClient: { get: jest.fn() },
}));

const mockedGet = apiClient.get as jest.Mock;

const page: Paginated<TutorSummary> = {
  data: [tutorSummary],
  meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
};

function notFound(): AxiosError {
  return new AxiosError('Not found', 'ERR_BAD_REQUEST', undefined, null, {
    status: 404,
    data: {},
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  });
}

describe('searchTutors (#43)', () => {
  it('sends only defined, non-empty filters as query params', async () => {
    mockedGet.mockResolvedValueOnce({ data: page });

    await searchTutors({ subjectId: 's1', q: '', minPrice: 20, format: undefined, sort: 'rating' });

    expect(mockedGet).toHaveBeenCalledWith(TUTOR_ENDPOINTS.search, {
      params: { subjectId: 's1', minPrice: 20, sort: 'rating' },
    });
  });

  it('resolves with the paginated envelope', async () => {
    mockedGet.mockResolvedValueOnce({ data: page });
    await expect(searchTutors({ page: 1 })).resolves.toEqual(page);
  });
});

describe('getTutorById (#44)', () => {
  it('requests the detail endpoint and returns the profile', async () => {
    mockedGet.mockResolvedValueOnce({ data: tutorProfile });

    await expect(getTutorById('tutor-1')).resolves.toEqual(tutorProfile);
    expect(mockedGet).toHaveBeenCalledWith(TUTOR_ENDPOINTS.byId('tutor-1'));
  });

  it('maps a 404 to TutorNotFoundError', async () => {
    mockedGet.mockRejectedValueOnce(notFound());

    await expect(getTutorById('missing')).rejects.toBeInstanceOf(TutorNotFoundError);
  });

  it('rethrows non-404 errors untouched', async () => {
    const boom = new Error('network down');
    mockedGet.mockRejectedValueOnce(boom);

    await expect(getTutorById('tutor-1')).rejects.toBe(boom);
  });
});
