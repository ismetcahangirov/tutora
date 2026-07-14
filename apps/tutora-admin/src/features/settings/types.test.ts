import { describe, expect, it } from 'vitest';

import {
  configKeySchema,
  descriptionSchema,
  featureFlagSchema,
  rolloutSchema,
  systemSettingSchema,
} from './types';

const rawFlag = {
  id: 'f1',
  key: 'in_app_payments',
  description: 'Master switch for checkout.',
  enabled: true,
  rolloutPercentage: 100,
  updatedById: 'admin1',
  createdAt: '2026-07-14T00:00:00.000Z',
  updatedAt: '2026-07-14T00:00:00.000Z',
};

const rawSetting = {
  id: 's1',
  key: 'maintenance_mode',
  value: { enabled: false, message: '' },
  description: null,
  updatedById: null,
  createdAt: '2026-07-14T00:00:00.000Z',
  updatedAt: '2026-07-14T00:00:00.000Z',
};

describe('featureFlagSchema', () => {
  it('parses a valid flag payload', () => {
    const flag = featureFlagSchema.parse(rawFlag);
    expect(flag.key).toBe('in_app_payments');
    expect(flag.enabled).toBe(true);
  });

  it('accepts a null description', () => {
    expect(featureFlagSchema.parse({ ...rawFlag, description: null }).description).toBeNull();
  });
});

describe('systemSettingSchema', () => {
  it('parses an arbitrary JSON value (object)', () => {
    const setting = systemSettingSchema.parse(rawSetting);
    expect(setting.value).toEqual({ enabled: false, message: '' });
  });

  it('accepts scalar and falsy values', () => {
    expect(systemSettingSchema.parse({ ...rawSetting, value: 0 }).value).toBe(0);
    expect(systemSettingSchema.parse({ ...rawSetting, value: false }).value).toBe(false);
    expect(systemSettingSchema.parse({ ...rawSetting, value: 'x' }).value).toBe('x');
  });
});

describe('configKeySchema', () => {
  it('accepts a lowercase underscore key', () => {
    expect(configKeySchema.safeParse('ai_tutor_matching').success).toBe(true);
  });

  it('rejects keys with spaces, uppercase, or a leading digit', () => {
    expect(configKeySchema.safeParse('Bad Key').success).toBe(false);
    expect(configKeySchema.safeParse('UPPER').success).toBe(false);
    expect(configKeySchema.safeParse('1leading').success).toBe(false);
  });
});

describe('rolloutSchema', () => {
  it('accepts whole numbers within 0–100', () => {
    expect(rolloutSchema.safeParse(0).success).toBe(true);
    expect(rolloutSchema.safeParse(100).success).toBe(true);
  });

  it('rejects out-of-range or fractional values', () => {
    expect(rolloutSchema.safeParse(-1).success).toBe(false);
    expect(rolloutSchema.safeParse(101).success).toBe(false);
    expect(rolloutSchema.safeParse(12.5).success).toBe(false);
  });
});

describe('descriptionSchema', () => {
  it('rejects a description over the length cap', () => {
    expect(descriptionSchema.safeParse('x'.repeat(201)).success).toBe(false);
  });
});
