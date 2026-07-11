/**
 * Onboarding feature — constants & user-facing copy (issue #23).
 *
 * No i18n system exists yet, so copy lives here as a single source of truth with
 * dot-namespaced keys that mirror the future i18n layout (as in the auth feature).
 */
import type { OnboardingSlide, RoleOption } from './types';

/** Backend endpoint that persists the role choice + completes onboarding. */
export const ONBOARDING_UPDATE_ME_ENDPOINT = '/api/v1/users/me';

/** Intro value-proposition slides shown to first-run, unauthenticated users. */
export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    key: 'discover',
    title: 'Find the right tutor',
    description: 'Search by budget, district, subject, rating, format, and language — in minutes.',
  },
  {
    key: 'transparent',
    title: 'Clear and transparent',
    description: 'Compare verified tutors with real reviews. No guesswork, no word-of-mouth.',
  },
  {
    key: 'flexible',
    title: 'Learn your way',
    description: 'Online or in person, in the language you prefer, on a schedule that fits.',
  },
];

/** The two roles a new user can pick. */
export const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'STUDENT',
    title: 'I’m a student or parent',
    description: 'Find and book trusted tutors that match your needs and budget.',
  },
  {
    role: 'TUTOR',
    title: 'I’m a tutor',
    description: 'Reach motivated students and grow a steady, predictable schedule.',
  },
];

/** Screen + error copy (i18n-ready placeholders). */
export const ONBOARDING_COPY = {
  role: {
    title: 'How will you use Tutora?',
    subtitle: 'Choose your role to personalize your experience.',
    continue: 'Continue',
    error: 'We could not save your choice. Please check your connection and try again.',
  },
} as const;
