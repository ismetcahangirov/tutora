/**
 * Token-integrity tests (issues #9, #10, #11). Pure data — no renderer required.
 */
import { darkColors, lightColors, radius, shadows, spacing, typography } from '@/theme';

describe('color tokens (#9)', () => {
  it('light and dark expose an identical set of keys', () => {
    expect(Object.keys(darkColors).sort()).toEqual(Object.keys(lightColors).sort());
  });

  it('uses the Tutora brand primary in light mode', () => {
    expect(lightColors.primary).toBe('#4F46E5');
  });

  it('contains only flat fills — no gradients anywhere', () => {
    const values = [...Object.values(lightColors), ...Object.values(darkColors)];
    for (const value of values) {
      expect(value.toLowerCase()).not.toContain('gradient');
      // Solid hex (#RRGGBB) or rgb/rgba only.
      expect(value).toMatch(/^#[0-9a-f]{6}$|^rgba?\(/i);
    }
  });
});

describe('spacing tokens (#11)', () => {
  it('every value lands on the 4pt grid', () => {
    for (const value of Object.values(spacing)) {
      expect(value % 4).toBe(0);
    }
  });

  it('matches the allowed scale exactly', () => {
    expect(Object.values(spacing)).toEqual([4, 8, 12, 16, 20, 24, 32, 40, 48, 64]);
  });
});

describe('radius tokens (#11)', () => {
  it('defaults the card radius (lg) to 16', () => {
    expect(radius.lg).toBe(16);
  });

  it('exposes a full/pill radius', () => {
    expect(radius.full).toBeGreaterThanOrEqual(999);
  });
});

describe('shadow tokens (#11)', () => {
  it('provides four elevation levels', () => {
    expect(Object.keys(shadows)).toEqual(['none', 'sm', 'md', 'lg']);
  });

  it('keeps level 0 truly flat', () => {
    expect(shadows.none.elevation).toBe(0);
    expect(shadows.none.shadowOpacity).toBe(0);
  });

  it('increases elevation with each level', () => {
    expect(shadows.sm.elevation).toBeLessThan(shadows.md.elevation as number);
    expect(shadows.md.elevation).toBeLessThan(shadows.lg.elevation as number);
  });
});

describe('typography scale (#10)', () => {
  it('never renders text below 12px', () => {
    for (const style of Object.values(typography)) {
      expect(style.fontSize ?? 0).toBeGreaterThanOrEqual(12);
    }
  });

  it('defines body as 16/24 regular', () => {
    expect(typography.body).toMatchObject({ fontSize: 16, lineHeight: 24, fontWeight: '400' });
  });

  it('maps variants to Plus Jakarta Sans weights', () => {
    expect(typography.display.fontFamily).toBe('PlusJakartaSans_700Bold');
    expect(typography.body.fontFamily).toBe('PlusJakartaSans_400Regular');
  });
});
