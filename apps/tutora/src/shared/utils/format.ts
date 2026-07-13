/**
 * Cross-feature formatting helpers (student epic #40).
 *
 * Money and rating values arrive from the API as plain numbers; screens render
 * them the same way everywhere (tutor cards, detail, favorites), so the
 * formatting lives here rather than being re-implemented per feature. The unit
 * suffix (e.g. "/hr") is a translated string owned by the caller — this returns
 * only the numeric+currency part.
 */

/** Currency code → display symbol. Unknown codes fall back to the raw code. */
const CURRENCY_SYMBOLS: Record<string, string> = {
  AZN: '₼',
  USD: '$',
  EUR: '€',
  RUB: '₽',
  TRY: '₺',
  GBP: '£',
};

/**
 * Group thousands with a space. Whole amounts render with no decimals (`30`);
 * fractional amounts render with exactly two (`29.90`), so money reads
 * consistently rather than mixing one- and two-digit fractions.
 */
function formatAmount(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const hasFraction = rounded % 1 !== 0;
  const fixed = rounded.toFixed(hasFraction ? 2 : 0);
  const dotIndex = fixed.indexOf('.');
  const whole = dotIndex === -1 ? fixed : fixed.slice(0, dotIndex);
  const fraction = dotIndex === -1 ? '' : fixed.slice(dotIndex + 1);
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return fraction ? `${grouped}.${fraction}` : grouped;
}

/**
 * Format a monetary amount with its currency, e.g. `25 ₼`, `1 500 ₽`, `40 $`.
 * The symbol trails the amount, matching the local (AZN-first) convention.
 */
export function formatPrice(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${formatAmount(amount)} ${symbol}`;
}

/** Round a rating to one decimal for display, e.g. `4.8`. Whole values keep `.0`. */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * Format an ISO timestamp as a short `d.m.yyyy` date (the local convention).
 * Done manually rather than via `Intl` so it renders identically regardless of
 * the Hermes ICU build. Returns an empty string for an unparseable input.
 */
export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}
