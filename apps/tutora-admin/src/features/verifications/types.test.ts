import { describe, expect, it } from 'vitest';

import { adminTutorSchema, CERTIFICATE_DECISIONS } from './types';

const rawTutor = {
  id: 't1',
  userId: 'u1',
  name: 'Bob',
  email: 'bob@example.com',
  avatarUrl: null,
  bio: null,
  experienceYears: 5,
  hourlyRate: 40,
  currency: 'AZN',
  verificationStatus: 'PENDING',
  ratingAvg: 4.5,
  ratingCount: 10,
  isPublished: false,
  subjects: [{ subjectId: 's1', name: 'Math', slug: 'math', priceOverride: null }],
  districts: [{ districtId: 'd1', name: 'Nasimi', slug: 'nasimi' }],
  languages: [{ languageId: 'l1', name: 'English', code: 'en' }],
  certificates: [
    {
      id: 'c1',
      title: 'BSc Mathematics',
      fileUrl: 'https://files.example.com/c1.pdf',
      status: 'PENDING',
      issuedBy: null,
      reviewedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
  // Fields the API also returns but the UI does not model:
  formats: ['ONLINE'],
  profileViews: 42,
  updatedAt: '2026-01-02T00:00:00.000Z',
};

describe('adminTutorSchema', () => {
  it('parses a full tutor payload with certificates', () => {
    const tutor = adminTutorSchema.parse(rawTutor);
    expect(tutor.verificationStatus).toBe('PENDING');
    expect(tutor.certificates).toHaveLength(1);
    expect(tutor.certificates[0]?.status).toBe('PENDING');
  });

  it('keeps only the name from each relation', () => {
    const tutor = adminTutorSchema.parse(rawTutor);
    expect(tutor.subjects[0]).toEqual({ name: 'Math' });
  });

  it('rejects an unknown verification status', () => {
    expect(adminTutorSchema.safeParse({ ...rawTutor, verificationStatus: 'MAYBE' }).success).toBe(
      false,
    );
  });
});

describe('CERTIFICATE_DECISIONS', () => {
  it('offers exactly approve and reject', () => {
    expect(CERTIFICATE_DECISIONS).toEqual(['VERIFIED', 'REJECTED']);
  });
});
