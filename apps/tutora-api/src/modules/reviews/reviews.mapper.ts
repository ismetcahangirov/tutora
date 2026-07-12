import { Prisma } from '@prisma/client';
import type { AdminReviewView, ReviewView } from './reviews.types';

/** Relations loaded for the student-facing and public review views. */
export const REVIEW_INCLUDE = {
  student: { select: { id: true, user: { select: { name: true, avatarUrl: true } } } },
} satisfies Prisma.ReviewInclude;

export type ReviewWithAuthor = Prisma.ReviewGetPayload<{ include: typeof REVIEW_INCLUDE }>;

/** Relations loaded for the admin moderation view — adds the reviewed tutor. */
export const ADMIN_REVIEW_INCLUDE = {
  student: { select: { id: true, user: { select: { name: true, avatarUrl: true } } } },
  tutor: { select: { id: true, user: { select: { name: true } } } },
} satisfies Prisma.ReviewInclude;

export type AdminReviewRow = Prisma.ReviewGetPayload<{ include: typeof ADMIN_REVIEW_INCLUDE }>;

export function toReviewView(r: ReviewWithAuthor): ReviewView {
  return {
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    status: r.status,
    author: {
      id: r.student.id,
      name: r.student.user.name,
      avatarUrl: r.student.user.avatarUrl,
    },
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export function toAdminReviewView(r: AdminReviewRow): AdminReviewView {
  return {
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    status: r.status,
    author: {
      id: r.student.id,
      name: r.student.user.name,
      avatarUrl: r.student.user.avatarUrl,
    },
    tutorId: r.tutor.id,
    tutorName: r.tutor.user.name,
    hiddenReason: r.hiddenReason,
    moderatedById: r.moderatedById,
    moderatedAt: r.moderatedAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}
