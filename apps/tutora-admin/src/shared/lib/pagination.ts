import { z } from 'zod';

/** Runtime schema for the API's pagination metadata (mirrors `PageMeta`). */
export const pageMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export type PageMeta = z.infer<typeof pageMetaSchema>;

/** Wrap an item schema in the API's standard `{ data, meta }` page envelope. */
export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({ data: z.array(item), meta: pageMetaSchema });
}

/** A validated page of `T`. */
export type Paginated<T> = { data: T[]; meta: PageMeta };
