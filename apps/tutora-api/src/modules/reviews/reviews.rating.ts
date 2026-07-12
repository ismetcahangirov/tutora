import { Prisma } from '@prisma/client';

/** Decimal places kept on the denormalised `TutorProfile.ratingAvg` column. */
const RATING_PRECISION = 2;

/**
 * Recomputes and persists a tutor's denormalised rating aggregate from the
 * source reviews. Only PUBLISHED, non-deleted reviews count toward the public
 * average — hidden/removed/soft-deleted reviews are excluded so moderation and
 * student deletion immediately reflect in the tutor's score.
 *
 * Runs inside the caller's transaction so the review write and the aggregate
 * update commit atomically.
 */
export async function recomputeTutorRating(
  tx: Prisma.TransactionClient,
  tutorId: string,
): Promise<void> {
  const aggregate = await tx.review.aggregate({
    where: { tutorId, status: 'PUBLISHED', deletedAt: null },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const count = aggregate._count._all;
  const avg = aggregate._avg.rating ?? 0;

  await tx.tutorProfile.update({
    where: { id: tutorId },
    data: {
      ratingCount: count,
      ratingAvg: Number(avg.toFixed(RATING_PRECISION)),
    },
  });
}
