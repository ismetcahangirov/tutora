/**
 * reviews API (#40, #44) — endpoint + pagination params.
 */
import { apiClient } from '@/shared/lib';
import { REVIEW_ENDPOINTS } from '@features/reviews/constants';

import { getTutorReviews } from '../reviews.api';

jest.mock('@/shared/lib', () => ({
  apiClient: { get: jest.fn() },
}));

const mockedGet = apiClient.get as jest.Mock;

describe('getTutorReviews (#44)', () => {
  it('requests the tutor reviews endpoint with paging params', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [], meta: {} } });

    await getTutorReviews('tutor-1', 2, 5);

    expect(mockedGet).toHaveBeenCalledWith(REVIEW_ENDPOINTS.forTutor('tutor-1'), {
      params: { page: 2, limit: 5 },
    });
  });

  it('defaults to the first page of 20', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [], meta: {} } });

    await getTutorReviews('tutor-1');

    expect(mockedGet).toHaveBeenCalledWith(REVIEW_ENDPOINTS.forTutor('tutor-1'), {
      params: { page: 1, limit: 20 },
    });
  });
});
