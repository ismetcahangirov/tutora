/**
 * CMS feature contracts (issue #67). Mirrors the API's `ContentEntryView` and
 * the admin write DTOs. Zod validates every backend payload at the boundary;
 * TypeScript types are inferred from the schemas. Dates arrive as ISO strings.
 */
import { z } from 'zod';

/** Content kinds (mirrors Prisma `ContentType`). */
export const CONTENT_TYPES = ['LANDING_SECTION', 'FAQ', 'BLOG_POST'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

/** Publication states (mirrors Prisma `ContentStatus`). */
export const CONTENT_STATUSES = ['DRAFT', 'PUBLISHED'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

/** Locale a new entry defaults to (mirrors the API's default). */
export const DEFAULT_FORM_LOCALE = 'en';

/**
 * Slug format: kebab-case, lowercase letters/digits joined by single hyphens
 * (mirrors the API's `CONTENT_SLUG_PATTERN`).
 */
export const CONTENT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Bounds mirrored from the API DTOs so the form fails fast at the boundary. */
export const SLUG_MAX_LENGTH = 120;
export const TITLE_MAX_LENGTH = 200;
export const EXCERPT_MAX_LENGTH = 300;
export const BODY_MAX_LENGTH = 20000;

/** A CMS content entry — the full editable record. */
export const contentEntrySchema = z.object({
  id: z.string(),
  type: z.enum(CONTENT_TYPES),
  locale: z.string(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string().nullable(),
  body: z.string(),
  coverImageUrl: z.string().nullable(),
  order: z.number(),
  status: z.enum(CONTENT_STATUSES),
  publishedAt: z.string().nullable(),
  authorId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ContentEntry = z.infer<typeof contentEntrySchema>;

/** Query parameters for the paginated admin content list. */
export type ListContentParams = {
  page: number;
  limit: number;
  type?: ContentType;
  locale?: string;
  status?: ContentStatus;
  q?: string;
};

/** Body of `POST /admin/content`. `type` + `locale` place the entry in a bucket. */
export type CreateContentBody = {
  type: ContentType;
  locale: string;
  slug: string;
  title: string;
  excerpt?: string;
  body: string;
  coverImageUrl?: string;
  order?: number;
  status?: ContentStatus;
};

/** Body of `PATCH /admin/content/:id`. Every field optional; type/locale fixed. */
export type UpdateContentBody = {
  slug?: string;
  title?: string;
  excerpt?: string;
  body?: string;
  coverImageUrl?: string;
  order?: number;
  status?: ContentStatus;
};

// --- Client-side form validation (mirrors the API DTO constraints) ----------

/** A slug: kebab-case, within the length cap. */
export const slugSchema = z.string().trim().min(1).max(SLUG_MAX_LENGTH).regex(CONTENT_SLUG_PATTERN);

/** A title: non-empty, within the cap. */
export const titleSchema = z.string().trim().min(1).max(TITLE_MAX_LENGTH);

/** Body copy: non-empty, within the cap. */
export const bodySchema = z.string().trim().min(1).max(BODY_MAX_LENGTH);

/** Optional excerpt, within the cap. */
export const excerptSchema = z.string().trim().max(EXCERPT_MAX_LENGTH);
