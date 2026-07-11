/**
 * Onboarding feature — constants (issue #23).
 *
 * User-facing copy lives in the i18n catalogs under the `onboarding.*` namespace
 * (`@/shared/i18n`). Only the structural keys — which slides exist and which
 * roles are selectable — live here; screens translate their titles/descriptions.
 */
import type { SelectableRole } from './types';

/** Backend endpoint that persists the role choice + completes onboarding. */
export const ONBOARDING_UPDATE_ME_ENDPOINT = '/api/v1/users/me';

/** Intro carousel slide keys, in display order. Copy: `onboarding.slides.<key>`. */
export const ONBOARDING_SLIDE_KEYS = ['discover', 'transparent', 'flexible'] as const;

/** Roles a new user can pick, in display order. Copy: `onboarding.roles.<role>`. */
export const SELECTABLE_ONBOARDING_ROLES: readonly SelectableRole[] = ['STUDENT', 'TUTOR'];
