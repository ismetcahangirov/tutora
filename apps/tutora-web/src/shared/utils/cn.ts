/**
 * Join conditional class names. Kept dependency-free (no clsx/tailwind-merge) so
 * the static landing ships the smallest possible client bundle — classes are
 * authored without conflicts, so plain concatenation is all we need.
 */
export type ClassValue = string | number | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}
