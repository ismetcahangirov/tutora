import { Prisma } from '@prisma/client';
import type { ApplicationView } from './applications.types';

/** Relations loaded whenever a full application is returned to either party. */
export const APPLICATION_INCLUDE = {
  subject: { select: { id: true, name: true, slug: true } },
  student: { select: { id: true, user: { select: { name: true, avatarUrl: true } } } },
  tutor: { select: { id: true, user: { select: { name: true, avatarUrl: true } } } },
} satisfies Prisma.ApplicationInclude;

export type ApplicationWithRelations = Prisma.ApplicationGetPayload<{
  include: typeof APPLICATION_INCLUDE;
}>;

export function toApplicationView(a: ApplicationWithRelations): ApplicationView {
  return {
    id: a.id,
    status: a.status,
    message: a.message,
    format: a.format,
    subject: a.subject ? { id: a.subject.id, name: a.subject.name, slug: a.subject.slug } : null,
    student: {
      id: a.student.id,
      name: a.student.user.name,
      avatarUrl: a.student.user.avatarUrl,
    },
    tutor: {
      id: a.tutor.id,
      name: a.tutor.user.name,
      avatarUrl: a.tutor.user.avatarUrl,
    },
    respondedAt: a.respondedAt,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}
