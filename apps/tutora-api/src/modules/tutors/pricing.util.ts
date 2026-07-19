import { BadRequestException } from '@nestjs/common';
import { PricingPeriod } from '@prisma/client';

/**
 * A pricing tier array replaces the tutor's whole base rate (or one subject's
 * whole override set) on write, so two rows for the same period would be
 * ambiguous — there'd be no way to tell which one is "the" HOURLY rate.
 */
export function assertUniquePricingPeriods(tiers: Array<{ period: PricingPeriod }>): void {
  const seen = new Set<PricingPeriod>();
  for (const tier of tiers) {
    if (seen.has(tier.period)) {
      throw new BadRequestException(`Duplicate pricing tier for period ${tier.period}`);
    }
    seen.add(tier.period);
  }
}

/**
 * Search filters, sorts and displays a tutor's price by their HOURLY tier —
 * the one period every price-range chip and sort option assumes. This mirrors
 * that value into `TutorProfile.hourlyRateCache` so the DB can index/filter/sort
 * on it directly instead of joining the normalized PricingTier table per row.
 */
export function resolveHourlyRateCache(
  tiers: Array<{ period: PricingPeriod; amount: number }>,
): number | null {
  return tiers.find((t) => t.period === PricingPeriod.HOURLY)?.amount ?? null;
}
