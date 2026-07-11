import { z } from 'zod';

/**
 * Public (client-exposed) environment for the mobile app. Only `EXPO_PUBLIC_*`
 * variables are inlined by Expo. Optional-with-defaults so builds never fail on
 * a missing var, but an invalid value still fails fast.
 */
const schema = z.object({
  EXPO_PUBLIC_API_URL: z.url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof schema>;

export const env: Env = schema.parse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
});
