/**
 * Onboarding feature — public barrel (issue #23).
 *
 * Import onboarding from here:
 * `import { WelcomeScreen, RoleSelectionScreen } from '@features/onboarding';`
 */
export { WelcomeScreen } from './components/WelcomeScreen';
export { RoleSelectionScreen } from './components/RoleSelectionScreen';
export { OnboardingCarousel } from './components/OnboardingCarousel';
export type { OnboardingCarouselProps } from './components/OnboardingCarousel';

export { useRoleSelection } from './hooks/useRoleSelection';
export type { UseRoleSelection } from './hooks/useRoleSelection';

export type { SelectableRole, OnboardingSlide, RoleOption } from './types';
