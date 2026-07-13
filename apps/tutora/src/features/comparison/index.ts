/**
 * Comparison feature — public barrel (student epic #40, #46).
 *
 * A leaf feature (imports nothing from `tutors`): it owns the "picked to compare"
 * selection state plus the presentational toggle and tray. The comparison screen
 * itself lives in the `tutors` feature, where the tutor profile data is fetched.
 * Import from here:
 *   `import { useComparison, ComparisonButton, ComparisonBar } from '@features/comparison';`
 */
export { useComparison, type UseComparison } from './hooks/useComparison';
export { ComparisonButton, type ComparisonButtonProps } from './components/ComparisonButton';
export { ComparisonBar, type ComparisonBarProps } from './components/ComparisonBar';
export { clearComparison } from './store/comparison-store';
export { COMPARISON_LIMIT, COMPARISON_MIN } from './constants';
export type { ComparisonEntry } from './types';
