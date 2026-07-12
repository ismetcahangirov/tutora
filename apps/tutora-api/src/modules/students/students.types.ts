import type { EducationLevel, VerificationStatus } from '@prisma/client';

/** The authenticated student's own profile (preferences live here, #30). */
export interface StudentProfileView {
  id: string;
  userId: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  educationLevel: EducationLevel | null;
  favoritesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/** A favorited tutor as seen in the student's favorites list. */
export interface FavoriteTutorView {
  tutorId: string;
  name: string | null;
  avatarUrl: string | null;
  hourlyRate: number;
  currency: string;
  ratingAvg: number;
  verificationStatus: VerificationStatus;
  isPublished: boolean;
  favoritedAt: Date;
}

/** Admin full view: the student projection plus account-level fields. */
export interface AdminStudentView extends StudentProfileView {
  email: string;
  deletedAt: Date | null;
}

/** Slim row used in admin list responses. */
export interface AdminStudentListItem {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  educationLevel: EducationLevel | null;
  favoritesCount: number;
  deletedAt: Date | null;
  createdAt: Date;
}
