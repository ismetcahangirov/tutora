import { parseDuration } from './parse-duration';

describe('parseDuration', () => {
  it.each([
    ['30s', 30_000],
    ['15m', 900_000],
    ['1h', 3_600_000],
    ['7d', 604_800_000],
    ['250ms', 250],
  ])('parses %s to %d ms', (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });

  it.each(['', '10', 'm', '10x', '1.5h', '-5m'])('throws on invalid input %s', (input) => {
    expect(() => parseDuration(input)).toThrow(/Invalid duration/);
  });
});
