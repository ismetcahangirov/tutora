import { z } from 'zod';

/**
 * Public (client-exposed) environment for the landing site. Only `NEXT_PUBLIC_*`
 * variables are readable in the browser. Optional-with-defaults so builds never
 * fail on a missing var, but an invalid value still fails fast.
 */
const schema = z.object({
  NEXT_PUBLIC_API_URL: z.url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof schema>;

export const env: Env = schema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});
