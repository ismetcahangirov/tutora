import { Prisma } from '@prisma/client';
import type { TutorSearchItem } from './search.types';

/**
 * Column/relation projection for search rows. Selects only what a result card
 * needs — certificates and internal counters are deliberately omitted to keep
 * the payload (and the query) lean.
 */
export const TUTOR_SEARCH_SELECT = {
  id: true,
  bio: true,
  experienceYears: true,
  hourlyRate: true,
  currency: true,
  formats: true,
  verificationStatus: true,
  ratingAvg: true,
  ratingCount: true,
  user: { select: { name: true, avatarUrl: true } },
  subjects: { select: { subjectId: true, subject: { select: { name: true, slug: true } } } },
  districts: { select: { districtId: true, district: { select: { name: true, slug: true } } } },
  languages: { select: { languageId: true, language: { select: { name: true, code: true } } } },
} satisfies Prisma.TutorProfileSelect;

export type TutorSearchRow = Prisma.TutorProfileGetPayload<{ select: typeof TUTOR_SEARCH_SELECT }>;

export function toTutorSearchItem(p: TutorSearchRow): TutorSearchItem {
  return {
    id: p.id,
    name: p.user.name,
    avatarUrl: p.user.avatarUrl,
    bio: p.bio,
    experienceYears: p.experienceYears,
    hourlyRate: Number(p.hourlyRate),
    currency: p.currency,
    formats: p.formats,
    verificationStatus: p.verificationStatus,
    ratingAvg: Number(p.ratingAvg),
    ratingCount: p.ratingCount,
    subjects: p.subjects.map((s) => ({
      subjectId: s.subjectId,
      name: s.subject.name,
      slug: s.subject.slug,
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
  };
}
