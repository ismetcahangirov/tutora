import { type Certificate, Prisma } from '@prisma/client';
import type {
  AdminTutorListItem,
  AdminTutorView,
  CertificateView,
  PublicTutorView,
  TutorProfileView,
} from './tutors.types';

/** Relations eagerly loaded whenever a full tutor profile is returned. */
export const TUTOR_PROFILE_INCLUDE = {
  user: { select: { name: true, avatarUrl: true, email: true } },
  subjects: { include: { subject: true }, orderBy: { createdAt: 'asc' } },
  districts: { include: { district: true } },
  languages: { include: { language: true } },
  certificates: { orderBy: { createdAt: 'desc' } },
} satisfies Prisma.TutorProfileInclude;

export type TutorProfileWithRelations = Prisma.TutorProfileGetPayload<{
  include: typeof TUTOR_PROFILE_INCLUDE;
}>;

/** Slim column set for admin list rows — relations are intentionally omitted. */
export const TUTOR_LIST_SELECT = {
  id: true,
  userId: true,
  hourlyRate: true,
  currency: true,
  verificationStatus: true,
  isPublished: true,
  ratingAvg: true,
  ratingCount: true,
  deletedAt: true,
  createdAt: true,
  user: { select: { name: true, email: true, avatarUrl: true } },
} satisfies Prisma.TutorProfileSelect;

export type TutorListRow = Prisma.TutorProfileGetPayload<{ select: typeof TUTOR_LIST_SELECT }>;

/** Prisma `Decimal` columns cross the wire as JS numbers. */
function num(value: Prisma.Decimal | number): number {
  return Number(value);
}

function numOrNull(value: Prisma.Decimal | null): number | null {
  return value === null ? null : Number(value);
}

export function toCertificateView(c: Certificate): CertificateView {
  return {
    id: c.id,
    title: c.title,
    fileUrl: c.fileUrl,
    status: c.status,
    issuedBy: c.issuedBy,
    reviewedAt: c.reviewedAt,
    createdAt: c.createdAt,
  };
}

export function toTutorProfileView(p: TutorProfileWithRelations): TutorProfileView {
  return {
    id: p.id,
    userId: p.userId,
    name: p.user.name,
    avatarUrl: p.user.avatarUrl,
    bio: p.bio,
    experienceYears: p.experienceYears,
    hourlyRate: num(p.hourlyRate),
    currency: p.currency,
    formats: p.formats,
    verificationStatus: p.verificationStatus,
    ratingAvg: num(p.ratingAvg),
    ratingCount: p.ratingCount,
    profileViews: p.profileViews,
    isPublished: p.isPublished,
    subjects: p.subjects.map((s) => ({
      subjectId: s.subjectId,
      name: s.subject.name,
      slug: s.subject.slug,
      priceOverride: numOrNull(s.priceOverride),
    })),
    districts: p.districts.map((d) => ({
      districtId: d.districtId,
      name: d.district.name,
      slug: d.district.slug,
    })),
    languages: p.languages.map((l) => ({
      languageId: l.languageId,
      name: l.language.name,
      code: l.language.code,
    })),
    certificates: p.certificates.map(toCertificateView),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export function toPublicTutorView(p: TutorProfileWithRelations): PublicTutorView {
  const full = toTutorProfileView(p);
  return {
    id: full.id,
    name: full.name,
    avatarUrl: full.avatarUrl,
    bio: full.bio,
    experienceYears: full.experienceYears,
    hourlyRate: full.hourlyRate,
    currency: full.currency,
    formats: full.formats,
    verificationStatus: full.verificationStatus,
    ratingAvg: full.ratingAvg,
    ratingCount: full.ratingCount,
    subjects: full.subjects,
    districts: full.districts,
    languages: full.languages,
    // Only certificates an admin has verified are shown publicly.
    certificates: full.certificates.filter((c) => c.status === 'VERIFIED'),
  };
}

export function toAdminTutorView(p: TutorProfileWithRelations): AdminTutorView {
  return { ...toTutorProfileView(p), email: p.user.email, deletedAt: p.deletedAt };
}

export function toAdminTutorListItem(p: TutorListRow): AdminTutorListItem {
  return {
    id: p.id,
    userId: p.userId,
    name: p.user.name,
    email: p.user.email,
    avatarUrl: p.user.avatarUrl,
    hourlyRate: num(p.hourlyRate),
    currency: p.currency,
    verificationStatus: p.verificationStatus,
    isPublished: p.isPublished,
    ratingAvg: num(p.ratingAvg),
    ratingCount: p.ratingCount,
    deletedAt: p.deletedAt,
    createdAt: p.createdAt,
  };
}
