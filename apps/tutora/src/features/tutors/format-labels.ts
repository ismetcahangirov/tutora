/**
 * Format-label helpers (student epic #40).
 *
 * Lesson-format codes (`ONLINE`, `AT_STUDENT_HOME`, `AT_TUTOR_PLACE`) map to
 * localized labels under the `tutors.format.*` namespace. Kept as a helper (not a
 * component) so both cards and the detail screen resolve labels the same way,
 * with a safe fallback to the raw code for any unknown value.
 */
import type { TFunction } from 'i18next';

export function formatLabel(t: TFunction, format: string): string {
  return t(`tutors.format.${format}`, { defaultValue: format });
}

/** Join several format codes into a single "· "-separated label string. */
export function formatLabels(t: TFunction, formats: string[]): string {
  return formats.map((format) => formatLabel(t, format)).join(' · ');
}
