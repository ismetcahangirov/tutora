import { describe, expect, it } from 'vitest';

import { adminReviewSchema, REVIEW_STATUSES } from './types';

const rawReview = {
  id: 'r1',
  rating: 4,
  comment: 'Great tutor, very patient.',
  status: 'PUBLISHED',
  author: { id: 's1', name: 'Alice', avatarUrl: null },
  tutorId: 't1',
  tutorName: 'Bob',
  hiddenReason: null,
  moderatedById: null,
  moderatedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  // Field the API may also return but the UI does not model:
  applicationId: 'a1',
};

describe('adminReviewSchema', () => {
  it('parses a valid admin review payload', () => {
    const review = adminReviewSchema.parse(rawReview);
    expect(review.status).toBe('PUBLISHED');
    expect(review.author.name).toBe('Alice');
    expect(review.tutorName).toBe('Bob');
  });

  it('accepts a null comment and moderation metadata', () => {
    const review = adminReviewSchema.parse({ ...rawReview, comment: null });
    expect(review.comment).toBeNull();
    expect(review.moderatedAt).toBeNull();
  });

  it('keeps the moderation reason when a review is hidden', () => {
    const review = adminReviewSchema.parse({
      ...rawReview,
      status: 'HIDDEN',
      hiddenReason: 'Spam',
      moderatedById: 'admin1',
      moderatedAt: '2026-02-01T00:00:00.000Z',
    });
    expect(review.status).toBe('HIDDEN');
    expect(review.hiddenReason).toBe('Spam');
  });

  it('rejects an unknown status', () => {
    expect(adminReviewSchema.safeParse({ ...rawReview, status: 'DELETED' }).success).toBe(false);
  });
});

describe('REVIEW_STATUSES', () => {
  it('lists the three moderation states', () => {
    expect(REVIEW_STATUSES).toEqual(['PUBLISHED', 'HIDDEN', 'REMOVED']);
  });
});
