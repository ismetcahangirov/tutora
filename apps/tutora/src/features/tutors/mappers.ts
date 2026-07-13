/**
 * Tutors feature — view-model mappers (student epic #40).
 *
 * Adapt the API shapes to the compact `TutorCardData` a card renders, and to the
 * `FavoriteTutor` snapshot the favorites store persists. Both target shapes are
 * intentionally identical (a card renders exactly what a favorite stores), so
 * saving from a live card is a straight field copy — no network fetch needed.
 */
import type { FavoriteTutor } from '@features/favorites';

import type { TutorProfile, TutorSummary } from './types';

/** The exact fields a tutor card renders. */
export type TutorCardData = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  hourlyRate: number;
  currency: string;
  isVerified: boolean;
  subjectNames: string[];
  formats: string[];
};

/** Reduce a tutor (summary or full profile) to the card/favorite field set. */
function toCardShape(tutor: TutorSummary | TutorProfile): TutorCardData {
  return {
    id: tutor.id,
    name: tutor.name,
    avatarUrl: tutor.avatarUrl,
    ratingAvg: tutor.ratingAvg,
    ratingCount: tutor.ratingCount,
    hourlyRate: tutor.hourlyRate,
    currency: tutor.currency,
    isVerified: tutor.verificationStatus === 'VERIFIED',
    subjectNames: tutor.subjects.map((subject) => subject.name),
    formats: tutor.formats,
  };
}

/** Map a search summary to the card view model. */
export function toTutorCardData(tutor: TutorSummary): TutorCardData {
  return toCardShape(tutor);
}

/** Build the persisted favorite snapshot from a summary or full profile. */
export function toFavoriteTutor(tutor: TutorSummary | TutorProfile): FavoriteTutor {
  return toCardShape(tutor);
}
