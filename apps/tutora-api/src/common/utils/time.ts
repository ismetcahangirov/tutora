export const MS_PER_HOUR = 3_600_000;
export const MS_PER_DAY = 86_400_000;

/** Returns a new `Date` `days` before `from` (never mutates the input). */
export function subtractDays(from: Date, days: number): Date {
  return new Date(from.getTime() - days * MS_PER_DAY);
}

/** Returns a new `Date` `hours` before `from` (never mutates the input). */
export function subtractHours(from: Date, hours: number): Date {
  return new Date(from.getTime() - hours * MS_PER_HOUR);
}
