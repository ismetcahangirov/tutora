/**
 * Comparison feature — constants (student epic #40, #46).
 */

/**
 * How many tutors can be compared at once. Three columns is the most that reads
 * comfortably side-by-side on a phone; beyond that the columns get too narrow to
 * scan. The selection UI disables adding a fourth.
 */
export const COMPARISON_LIMIT = 3;

/** The minimum selection that makes a comparison meaningful. */
export const COMPARISON_MIN = 2;

/** MMKV key for the persisted comparison selection. */
export const COMPARISON_STORAGE_KEY = 'comparison.tutors';
