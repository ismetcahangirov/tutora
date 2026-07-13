/**
 * reviews API (#44, #48) — endpoints + pagination params for read and write.
 */
import { apiClient } from '@/shared/lib';
import { REVIEW_ENDPOINTS } from '@features/reviews/constants';

import {
  deleteReview,
  getMyReviews,
  getTutorReviews,
  submitReview,
  updateReview,
} from '../reviews.api';

jest.mock('@/shared/lib', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const mockedGet = apiClient.get as jest.Mock;
const mockedPost = apiClient.post as jest.Mock;
const mockedPatch = apiClient.patch as jest.Mock;
const mockedDelete = apiClient.delete as jest.Mock;

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

describe('getMyReviews (#48)', () => {
  it('requests the caller reviews endpoint with paging params', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [], meta: {} } });

    await getMyReviews(3, 10);

    expect(mockedGet).toHaveBeenCalledWith(REVIEW_ENDPOINTS.mine, {
      params: { page: 3, limit: 10 },
    });
  });

  it('defaults to the first page of 20', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [], meta: {} } });

    await getMyReviews();

    expect(mockedGet).toHaveBeenCalledWith(REVIEW_ENDPOINTS.mine, {
      params: { page: 1, limit: 20 },
    });
  });
});

describe('submitReview (#48)', () => {
  it('posts the application, rating and comment to the reviews root', async () => {
    mockedPost.mockResolvedValueOnce({ data: { id: 'r1' } });

    await submitReview({ applicationId: 'app-1', rating: 5, comment: 'Great' });

    expect(mockedPost).toHaveBeenCalledWith(REVIEW_ENDPOINTS.root, {
      applicationId: 'app-1',
      rating: 5,
      comment: 'Great',
    });
  });

  it('returns the created review', async () => {
    mockedPost.mockResolvedValueOnce({ data: { id: 'r1', rating: 4 } });

    const review = await submitReview({ applicationId: 'app-1', rating: 4 });

    expect(review).toEqual({ id: 'r1', rating: 4 });
  });
});

describe('updateReview (#48)', () => {
  it('patches the review by id with the changed fields', async () => {
    mockedPatch.mockResolvedValueOnce({ data: { id: 'r1' } });

    await updateReview('r1', { rating: 3, comment: 'Revised' });

    expect(mockedPatch).toHaveBeenCalledWith(REVIEW_ENDPOINTS.byId('r1'), {
      rating: 3,
      comment: 'Revised',
    });
  });
});

describe('deleteReview (#48)', () => {
  it('deletes the review by id', async () => {
    mockedDelete.mockResolvedValueOnce({ data: undefined });

    await deleteReview('r1');

    expect(mockedDelete).toHaveBeenCalledWith(REVIEW_ENDPOINTS.byId('r1'));
  });
});
