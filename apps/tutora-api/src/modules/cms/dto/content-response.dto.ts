import { ApiProperty } from '@nestjs/swagger';
import { ContentStatus, ContentType } from '@prisma/client';

/**
 * Response shapes for the CMS endpoints. These mirror the projections in
 * `cms.types.ts` (`ContentEntryView`, `PublicContentView`) and exist so Swagger
 * can advertise the response schema — the TypeScript interfaces are erased at
 * compile time and are invisible to the OpenAPI generator.
 */

/** Admin-facing projection of a content entry — the full editable record. */
export class ContentEntryViewDto {
  @ApiProperty({ description: 'Content entry id.' })
  id!: string;

  @ApiProperty({ enum: ContentType, enumName: 'ContentType' })
  type!: ContentType;

  @ApiProperty({ description: 'Locale of the entry.', example: 'en' })
  locale!: string;

  @ApiProperty({ description: 'URL-safe slug, unique per type+locale.', example: 'how-it-works' })
  slug!: string;

  @ApiProperty({ description: 'Entry title.' })
  title!: string;

  @ApiProperty({ nullable: true, type: String, description: 'Short summary, if any.' })
  excerpt!: string | null;

  @ApiProperty({ description: 'Main content body.' })
  body!: string;

  @ApiProperty({ nullable: true, type: String, description: 'Cover image URL, if any.' })
  coverImageUrl!: string | null;

  @ApiProperty({ description: 'Display order within its bucket.', example: 0 })
  order!: number;

  @ApiProperty({ enum: ContentStatus, enumName: 'ContentStatus' })
  status!: ContentStatus;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'When the entry was first published, if ever.',
  })
  publishedAt!: string | null;

  @ApiProperty({ nullable: true, type: String, description: 'Authoring admin id, if attributed.' })
  authorId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

/**
 * Public projection served to the marketing site. Drops editorial fields
 * (status, author, timestamps other than `publishedAt`).
 */
export class PublicContentViewDto {
  @ApiProperty({ enum: ContentType, enumName: 'ContentType' })
  type!: ContentType;

  @ApiProperty({ description: 'Locale of the entry.', example: 'en' })
  locale!: string;

  @ApiProperty({ description: 'URL-safe slug.', example: 'how-it-works' })
  slug!: string;

  @ApiProperty({ description: 'Entry title.' })
  title!: string;

  @ApiProperty({ nullable: true, type: String, description: 'Short summary, if any.' })
  excerpt!: string | null;

  @ApiProperty({ description: 'Main content body.' })
  body!: string;

  @ApiProperty({ nullable: true, type: String, description: 'Cover image URL, if any.' })
  coverImageUrl!: string | null;

  @ApiProperty({ description: 'Display order within its bucket.', example: 0 })
  order!: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'When the entry was published, if ever.',
  })
  publishedAt!: string | null;
}
