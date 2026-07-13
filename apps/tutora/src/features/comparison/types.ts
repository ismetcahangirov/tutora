/**
 * Comparison feature — types (student epic #40, #46).
 *
 * A comparison entry is a tiny, self-contained *reference* to a tutor the student
 * picked to compare — just enough to render an instant column header (name +
 * avatar) and to key the profile fetch. The full attributes shown side-by-side
 * are loaded on demand on the comparison screen, so the entry stays lightweight
 * and the feature imports nothing from `tutors` (it stays a leaf, like favorites).
 */
export type ComparisonEntry = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
};
