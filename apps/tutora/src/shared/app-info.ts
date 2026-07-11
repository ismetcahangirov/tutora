import { APP_NAME } from '@shared/constants';

/** Central app identity. Also confirms the `@shared/*` path alias resolves. */
export const APP_INFO = { name: APP_NAME } as const;
