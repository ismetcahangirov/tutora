/** Placeholder for an absent or invalid amount. */
const EMPTY = '—';

/**
 * Localized currency amount (e.g. "AZN 9.99"). Falls back to a dash on a
 * non-finite amount, and — if the runtime rejects an unknown/invalid currency
 * code — to the numeric amount followed by the raw code, so a bad code never
 * throws in render.
 */
export function formatMoney(
  amount: number | null | undefined,
  currency: string,
  locale: string,
): string {
  if (amount == null || !Number.isFinite(amount)) return EMPTY;
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    return `${new Intl.NumberFormat(locale).format(amount)} ${currency}`;
  }
}
