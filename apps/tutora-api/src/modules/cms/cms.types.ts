import type { ContentEntry, ContentStatus, ContentType } from '@prisma/client';

/**
 * Slug format for content entries (#67): a kebab-case identifier of lowercase
 * letters and digits joined by single hyphens (e.g. `how-it-works`). Unique per
 * `(type, locale)`. Kept here as the single source of truth for the DTO
 * `@Matches` guard.
 */
export const CONTENT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Admin-facing projection of a content entry — the full editable record. */
export interface ContentEntryView {
  id: string;
  type: ContentType;
  locale: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  coverImageUrl: string | null;
  order: number;
  status: ContentStatus;
  publishedAt: Date | null;
  authorId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Public projection served to the marketing site (#67). Drops editorial fields
 * (status, author, timestamps other than `publishedAt`) that the public has no
 * business seeing.
 */
export interface PublicContentView {
  type: ContentType;
  locale: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  coverImageUrl: string | null;
  order: number;
  publishedAt: Date | null;
}

/** Maps a `ContentEntry` row to its admin view. */
export function toContentEntryView(entry: ContentEntry): ContentEntryView {
  return {
    id: entry.id,
    type: entry.type,
    locale: entry.locale,
    slug: entry.slug,
    title: entry.title,
    excerpt: entry.excerpt,
    body: entry.body,
    coverImageUrl: entry.coverImageUrl,
    order: entry.order,
    status: entry.status,
    publishedAt: entry.publishedAt,
    authorId: entry.authorId,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

/** Maps a `ContentEntry` row to the lean public view. */
export function toPublicContentView(entry: ContentEntry): PublicContentView {
  return {
    type: entry.type,
    locale: entry.locale,
    slug: entry.slug,
    title: entry.title,
    excerpt: entry.excerpt,
    body: entry.body,
    coverImageUrl: entry.coverImageUrl,
    order: entry.order,
    publishedAt: entry.publishedAt,
  };
}
