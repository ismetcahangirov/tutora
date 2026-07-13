/**
 * Shared tutor fixtures for the tutors feature tests (student epic #40).
 *
 * Not a test file (no `.test` suffix), so the runner ignores it; imported by the
 * mapper, API, hook, and component specs to avoid re-declaring shapes.
 */
import type { TutorProfile, TutorSummary } from '../types';

export const tutorSummary: TutorSummary = {
  id: 'tutor-1',
  name: 'Aygün Məmmədova',
  avatarUrl: null,
  bio: 'Experienced mathematics tutor.',
  experienceYears: 6,
  hourlyRate: 30,
  currency: 'AZN',
  formats: ['ONLINE', 'AT_STUDENT_HOME'],
  verificationStatus: 'VERIFIED',
  ratingAvg: 4.8,
  ratingCount: 42,
  subjects: [{ subjectId: 's1', name: 'Mathematics', slug: 'mathematics' }],
  districts: [{ districtId: 'd1', name: 'Nəsimi', slug: 'nasimi' }],
  languages: [{ languageId: 'l1', name: 'Azərbaycan', code: 'az' }],
};

export const tutorProfile: TutorProfile = {
  ...tutorSummary,
  subjects: [
    { subjectId: 's1', name: 'Mathematics', slug: 'mathematics', priceOverride: null },
    { subjectId: 's2', name: 'Physics', slug: 'physics', priceOverride: 45 },
  ],
  certificates: [
    {
      id: 'c1',
      title: 'MSc Mathematics',
      fileUrl: 'https://example.com/cert.pdf',
      status: 'VERIFIED',
      issuedBy: 'Baku State University',
      reviewedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2025-12-01T00:00:00.000Z',
    },
  ],
};
