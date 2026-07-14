/**
 * tutor-applications API (#57) — the shared client is mocked; we assert the list
 * request shape (status filter is only sent when set) and that each action hits
 * its dedicated endpoint.
 */
import { apiClient } from '@/shared/lib';
import type { Paginated } from '@/shared';
import { APPLICATION_ENDPOINTS } from '@features/tutor-applications/constants';
import type { TutorApplication } from '@features/tutor-applications/types';

import {
  acceptApplication,
  completeApplication,
  declineApplication,
  listTutorApplications,
} from '../applications.api';

jest.mock('@/shared/lib', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

const mocked = apiClient as unknown as { get: jest.Mock; post: jest.Mock };

const application: TutorApplication = {
  id: 'app-1',
  status: 'PENDING',
  message: 'Salam, kömək lazımdır',
  format: 'ONLINE',
  subject: { id: 's-1', name: 'Riyaziyyat', slug: 'math' },
  student: { id: 'st-1', name: 'Nihad', avatarUrl: null },
  respondedAt: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

const page: Paginated<TutorApplication> = {
  data: [application],
  meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
};

describe('listTutorApplications (#57)', () => {
  it('omits the status param when no filter is given', async () => {
    mocked.get.mockResolvedValueOnce({ data: page });

    await listTutorApplications();

    expect(mocked.get).toHaveBeenCalledWith(APPLICATION_ENDPOINTS.root, {
      params: { page: 1, limit: 20 },
    });
  });

  it('sends the status param when filtered', async () => {
    mocked.get.mockResolvedValueOnce({ data: page });

    await listTutorApplications('PENDING');

    expect(mocked.get).toHaveBeenCalledWith(APPLICATION_ENDPOINTS.root, {
      params: { page: 1, limit: 20, status: 'PENDING' },
    });
  });
});

describe('application actions (#57)', () => {
  it('accepts, declines, and completes via their endpoints', async () => {
    mocked.post.mockResolvedValue({ data: application });

    await acceptApplication('app-1');
    expect(mocked.post).toHaveBeenCalledWith(APPLICATION_ENDPOINTS.accept('app-1'));

    await declineApplication('app-1');
    expect(mocked.post).toHaveBeenCalledWith(APPLICATION_ENDPOINTS.decline('app-1'));

    await completeApplication('app-1');
    expect(mocked.post).toHaveBeenCalledWith(APPLICATION_ENDPOINTS.complete('app-1'));
  });
});
