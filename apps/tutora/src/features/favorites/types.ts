/**
 * Favorites feature — types (student epic #40, #45).
 *
 * A favorite is a compact, self-contained *snapshot* of a tutor at the moment it
 * was saved — deliberately decoupled from the tutors API shape so the favorites
 * feature stays a leaf (it imports nothing from `tutors`) and the saved list
 * renders instantly and offline, with no network round-trip. The snapshot carries
 * exactly what a tutor card renders; richer profile data is fetched on demand
 * when the user opens the detail screen.
 */
export type FavoriteTutor = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  hourlyRate: number;
  currency: string;
  isVerified: boolean;
  /** Subject display names, already resolved. */
  subjectNames: string[];
  /** Lesson-format codes (e.g. `ONLINE`), rendered to labels by the card. */
  formats: string[];
};
