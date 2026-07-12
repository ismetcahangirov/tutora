import { PlanTier, type Prisma } from '@prisma/client';

/**
 * The capabilities a plan grants (#36). This is the single source of truth for
 * what FREE vs PRO unlocks; feature modules resolve a user's entitlements
 * through {@link SubscriptionsService.getSummary} rather than branching on the
 * raw tier, so every limit lives in one place and a plan's stored overrides are
 * always honoured.
 */
export interface Entitlements {
  /** Max concurrent open applications (PENDING/ACCEPTED) a student may hold. */
  maxActiveApplications: number;
  /** Max favourite tutors a student may save. */
  maxFavorites: number;
  /** Tutor: profile is eligible for boosted / featured placement in search. */
  featuredProfile: boolean;
  /** Access to the analytics dashboard. */
  analytics: boolean;
  /** Priority support queue. */
  prioritySupport: boolean;
}

/** Baseline entitlements per tier, applied when a plan carries no overrides. */
const TIER_DEFAULTS: Readonly<Record<PlanTier, Entitlements>> = {
  [PlanTier.FREE]: {
    maxActiveApplications: 3,
    maxFavorites: 20,
    featuredProfile: false,
    analytics: false,
    prioritySupport: false,
  },
  [PlanTier.PRO]: {
    maxActiveApplications: 50,
    maxFavorites: 500,
    featuredProfile: true,
    analytics: true,
    prioritySupport: true,
  },
};

/** The immutable baseline for a tier (a fresh copy, safe for the caller to keep). */
export function defaultEntitlements(tier: PlanTier): Entitlements {
  return { ...TIER_DEFAULTS[tier] };
}

function asLimit(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function asFlag(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * Resolves a plan's effective entitlements: the tier baseline with any stored
 * `Plan.entitlements` overrides merged on top. Overrides are validated field by
 * field — a malformed or partial JSON blob can only narrow to known keys, never
 * inject arbitrary capabilities — so persisted data can be trusted at read time.
 */
export function resolveEntitlements(
  tier: PlanTier,
  overrides?: Prisma.JsonValue | null,
): Entitlements {
  const base = defaultEntitlements(tier);
  if (overrides == null || typeof overrides !== 'object' || Array.isArray(overrides)) {
    return base;
  }
  const o = overrides as Record<string, unknown>;
  return {
    maxActiveApplications: asLimit(o.maxActiveApplications, base.maxActiveApplications),
    maxFavorites: asLimit(o.maxFavorites, base.maxFavorites),
    featuredProfile: asFlag(o.featuredProfile, base.featuredProfile),
    analytics: asFlag(o.analytics, base.analytics),
    prioritySupport: asFlag(o.prioritySupport, base.prioritySupport),
  };
}
