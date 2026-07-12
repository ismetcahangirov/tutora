import { Prisma } from '@prisma/client';
import type {
  AdminStudentListItem,
  AdminStudentView,
  FavoriteTutorView,
  StudentProfileView,
} from './students.types';

/** Relations loaded whenever a full student profile is returned. */
export const STUDENT_PROFILE_INCLUDE = {
  user: { select: { name: true, avatarUrl: true, email: true } },
  _count: { select: { favorites: true } },
} satisfies Prisma.StudentProfileInclude;

export type StudentProfileWithRelations = Prisma.StudentProfileGetPayload<{
  include: typeof STUDENT_PROFILE_INCLUDE;
}>;

/** Slim column set for admin list rows. */
export const STUDENT_LIST_SELECT = {
  id: true,
  userId: true,
  educationLevel: true,
  deletedAt: true,
  createdAt: true,
  user: { select: { name: true, email: true, avatarUrl: true } },
  _count: { select: { favorites: true } },
} satisfies Prisma.StudentProfileSelect;

export type StudentListRow = Prisma.StudentProfileGetPayload<{
  select: typeof STUDENT_LIST_SELECT;
}>;

/** Include used when loading the favorites list (favorited tutor + owner). */
export const FAVORITE_INCLUDE = {
  tutor: {
    select: {
      id: true,
      hourlyRate: true,
      currency: true,
      ratingAvg: true,
      verificationStatus: true,
      isPublished: true,
      user: { select: { name: true, avatarUrl: true } },
    },
  },
} satisfies Prisma.FavoriteInclude;

export type FavoriteWithTutor = Prisma.FavoriteGetPayload<{ include: typeof FAVORITE_INCLUDE }>;

export function toStudentProfileView(p: StudentProfileWithRelations): StudentProfileView {
  return {
    id: p.id,
    userId: p.userId,
    name: p.user.name,
    avatarUrl: p.user.avatarUrl,
    bio: p.bio,
    educationLevel: p.educationLevel,
    favoritesCount: p._count.favorites,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export function toAdminStudentView(p: StudentProfileWithRelations): AdminStudentView {
  return { ...toStudentProfileView(p), email: p.user.email, deletedAt: p.deletedAt };
}

export function toAdminStudentListItem(p: StudentListRow): AdminStudentListItem {
  return {
    id: p.id,
    userId: p.userId,
    name: p.user.name,
    email: p.user.email,
    avatarUrl: p.user.avatarUrl,
    educationLevel: p.educationLevel,
    favoritesCount: p._count.favorites,
    deletedAt: p.deletedAt,
    createdAt: p.createdAt,
  };
}

export function toFavoriteTutorView(f: FavoriteWithTutor): FavoriteTutorView {
  return {
    tutorId: f.tutor.id,
    name: f.tutor.user.name,
    avatarUrl: f.tutor.user.avatarUrl,
    hourlyRate: Number(f.tutor.hourlyRate),
    currency: f.tutor.currency,
    ratingAvg: Number(f.tutor.ratingAvg),
    verificationStatus: f.tutor.verificationStatus,
    isPublished: f.tutor.isPublished,
    favoritedAt: f.createdAt,
  };
}
