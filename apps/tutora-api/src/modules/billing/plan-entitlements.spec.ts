import { PlanTier } from '@prisma/client';
import { defaultEntitlements, resolveEntitlements } from './plan-entitlements';

describe('defaultEntitlements', () => {
  it('grants a narrow baseline on FREE and a wide one on PRO', () => {
    expect(defaultEntitlements(PlanTier.FREE)).toMatchObject({
      maxActiveApplications: 3,
      analytics: false,
      featuredProfile: false,
    });
    expect(defaultEntitlements(PlanTier.PRO)).toMatchObject({
      maxActiveApplications: 50,
      analytics: true,
      featuredProfile: true,
    });
  });

  it('returns a fresh copy each call (mutating one never leaks into the next)', () => {
    const a = defaultEntitlements(PlanTier.FREE);
    a.maxActiveApplications = 999;
    expect(defaultEntitlements(PlanTier.FREE).maxActiveApplications).toBe(3);
  });
});

describe('resolveEntitlements', () => {
  it('falls back to the tier baseline when there are no overrides', () => {
    expect(resolveEntitlements(PlanTier.PRO)).toEqual(defaultEntitlements(PlanTier.PRO));
    expect(resolveEntitlements(PlanTier.FREE, null)).toEqual(defaultEntitlements(PlanTier.FREE));
  });

  it('merges a partial override on top of the baseline', () => {
    const resolved = resolveEntitlements(PlanTier.FREE, { maxFavorites: 100, analytics: true });
    expect(resolved).toMatchObject({
      maxFavorites: 100, // overridden
      analytics: true, // overridden
      maxActiveApplications: 3, // baseline preserved
    });
  });

  it('ignores malformed values so a bad blob can never widen access', () => {
    const resolved = resolveEntitlements(PlanTier.FREE, {
      maxActiveApplications: 'lots', // wrong type
      maxFavorites: -5, // out of range
      analytics: 'yes', // not a boolean
      unknownFlag: true, // unknown key
    });
    expect(resolved).toEqual(defaultEntitlements(PlanTier.FREE));
  });

  it('ignores a non-object override (array / primitive)', () => {
    expect(resolveEntitlements(PlanTier.PRO, [1, 2, 3])).toEqual(defaultEntitlements(PlanTier.PRO));
    expect(resolveEntitlements(PlanTier.PRO, 42)).toEqual(defaultEntitlements(PlanTier.PRO));
  });
});
