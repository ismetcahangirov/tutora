/**
 * Onboarding feature — shared types (issue #23).
 */
import type { UserRole } from '@features/auth';

/** Roles a user may choose during onboarding. ADMIN is assigned out-of-band. */
export type SelectableRole = Extract<UserRole, 'STUDENT' | 'TUTOR'>;

/** A single value-proposition slide in the intro carousel. */
export type OnboardingSlide = {
  key: string;
  title: string;
  description: string;
};

/** A selectable role on the role-selection screen. */
export type RoleOption = {
  role: SelectableRole;
  title: string;
  description: string;
};
