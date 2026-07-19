/**
 * tutor-profile API (#51, #53, #56) — the shared client is mocked; we assert each
 * call hits the right endpoint with the right verb + body, and returns the typed
 * profile the caches are written from.
 */
import { apiClient } from '@/shared/lib';
import { TUTOR_PROFILE_ENDPOINTS } from '@features/tutor-profile/constants';
import type { MyTutorProfile } from '@features/tutor-profile/types';

import {
  addTutorDistrict,
  addTutorLanguage,
  getMyTutorProfile,
  removeTutorSubject,
  submitTutorVerification,
  updateMyTutorProfile,
  upsertTutorSubject,
} from '../tutor-profile.api';

jest.mock('@/shared/lib', () => ({
  apiClient: {
    get: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    post: jest.fn(),
  },
}));

const mocked = apiClient as unknown as {
  get: jest.Mock;
  patch: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
  post: jest.Mock;
};

const profile: MyTutorProfile = {
  id: 'tp-1',
  userId: 'u-1',
  name: 'Aygün Məmmədova',
  avatarUrl: null,
  bio: 'Riyaziyyat müəllimi',
  experienceYears: 6,
  hourlyRate: 30,
  pricingTiers: [{ period: 'HOURLY', amount: 30 }],
  currency: 'AZN',
  formats: ['ONLINE'],
  verificationStatus: 'VERIFIED',
  ratingAvg: 4.8,
  ratingCount: 12,
  profileViews: 340,
  isPublished: true,
  subjects: [{ subjectId: 's-1', name: 'Riyaziyyat', slug: 'math', pricingTiers: [] }],
  districts: [{ districtId: 'd-1', name: 'Nəsimi', slug: 'nasimi' }],
  languages: [{ languageId: 'l-1', name: 'Azərbaycan', code: 'az' }],
  certificates: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

describe('tutor-profile API (#53)', () => {
  it('reads the caller profile from /tutors/me', async () => {
    mocked.get.mockResolvedValueOnce({ data: profile });

    await expect(getMyTutorProfile()).resolves.toEqual(profile);
    expect(mocked.get).toHaveBeenCalledWith(TUTOR_PROFILE_ENDPOINTS.me);
  });

  it('patches only the fields it is given', async () => {
    mocked.patch.mockResolvedValueOnce({ data: profile });

    await updateMyTutorProfile({
      pricingTiers: [{ period: 'HOURLY', amount: 35 }],
      formats: ['ONLINE', 'AT_TUTOR_PLACE'],
    });

    expect(mocked.patch).toHaveBeenCalledWith(TUTOR_PROFILE_ENDPOINTS.me, {
      pricingTiers: [{ period: 'HOURLY', amount: 35 }],
      formats: ['ONLINE', 'AT_TUTOR_PLACE'],
    });
  });

  it('upserts a subject with its optional price-override tiers (#56, #178)', async () => {
    mocked.put.mockResolvedValueOnce({ data: profile });

    await upsertTutorSubject({
      subjectId: 's-2',
      pricingTiers: [{ period: 'HOURLY', amount: 40 }],
    });

    expect(mocked.put).toHaveBeenCalledWith(TUTOR_PROFILE_ENDPOINTS.subjects, {
      subjectId: 's-2',
      pricingTiers: [{ period: 'HOURLY', amount: 40 }],
    });
  });

  it('removes a subject by id', async () => {
    mocked.delete.mockResolvedValueOnce({ data: profile });

    await removeTutorSubject('s-1');

    expect(mocked.delete).toHaveBeenCalledWith(TUTOR_PROFILE_ENDPOINTS.subjectById('s-1'));
  });

  it('adds a district and a language through their PUT endpoints', async () => {
    mocked.put.mockResolvedValue({ data: profile });

    await addTutorDistrict('d-2');
    expect(mocked.put).toHaveBeenCalledWith(TUTOR_PROFILE_ENDPOINTS.districts, {
      districtId: 'd-2',
    });

    await addTutorLanguage('l-2');
    expect(mocked.put).toHaveBeenCalledWith(TUTOR_PROFILE_ENDPOINTS.languages, {
      languageId: 'l-2',
    });
  });

  it('submits the profile for verification', async () => {
    mocked.post.mockResolvedValueOnce({ data: { ...profile, verificationStatus: 'PENDING' } });

    const result = await submitTutorVerification();

    expect(mocked.post).toHaveBeenCalledWith(TUTOR_PROFILE_ENDPOINTS.verification);
    expect(result.verificationStatus).toBe('PENDING');
  });
});
