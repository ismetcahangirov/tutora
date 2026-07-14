import { z } from 'zod';

/**
 * Public (client-exposed) environment for the admin SPA. Only `VITE_*` variables
 * are exposed by Vite. Optional-with-defaults so builds never fail on a missing
 * var, but an invalid value still fails fast.
 */
const schema = z.object({
  VITE_API_URL: z.url().default('http://localhost:3000'),
  /** Google OAuth client ID for admin sign-in. Empty until configured. */
  VITE_GOOGLE_CLIENT_ID: z.string().default(''),
});

export type Env = z.infer<typeof schema>;

export const env: Env = schema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
});
