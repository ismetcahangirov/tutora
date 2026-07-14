/** Placeholder for an absent or invalid date. */
const EMPTY = '—';

/** Localized medium date (e.g. "14 Jul 2026"). Falls back to a dash on empty/invalid input. */
export function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return EMPTY;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return EMPTY;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

/** Localized date + time. Used where the exact moment matters (audit-style fields). */
export function formatDateTime(iso: string | null | undefined, locale: string): string {
  if (!iso) return EMPTY;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return EMPTY;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
