const UNIT_TO_MS = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
} as const;

/**
 * Converts a duration string like '15m' or '7d' into milliseconds.
 * Supported units: ms, s, m, h, d. Throws on any other format.
 */
export function parseDuration(value: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid duration: "${value}"`);
  }
  // The regex guarantees group 2 is one of the known units when it matches.
  const unit = match[2] as keyof typeof UNIT_TO_MS;
  return Number(match[1]) * UNIT_TO_MS[unit];
}
