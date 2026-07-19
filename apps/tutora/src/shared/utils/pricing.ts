/**
 * Cross-feature pricing-tier display helper (#178).
 *
 * A tutor (or one of their subjects) can set up to one amount per billing
 * period; a compact display (a subject tag, a card) can only show one, so
 * every caller needs the same "which one wins" rule. Generic over any
 * `{period, amount}` shape so both the `tutors` and `tutor-profile` features'
 * own `PricingTier` types (duplicated per the feature-first convention) flow
 * through without a cross-feature type import.
 */

/** A billing cadence a tutor can price at. Mirrors the backend `PricingPeriod` enum. */
export type PricingPeriod = 'HOURLY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

/** Preference order when only one tier can be shown. */
export const PRICE_DISPLAY_PERIOD_ORDER: PricingPeriod[] = [
  'HOURLY',
  'WEEKLY',
  'MONTHLY',
  'YEARLY',
];

/** Picks the HOURLY tier if set, else the first other period in display order. */
export function pickDisplayTier<T extends { period: PricingPeriod }>(tiers: T[]): T | null {
  for (const period of PRICE_DISPLAY_PERIOD_ORDER) {
    const tier = tiers.find((t) => t.period === period);
    if (tier) {
      return tier;
    }
  }
  return null;
}
