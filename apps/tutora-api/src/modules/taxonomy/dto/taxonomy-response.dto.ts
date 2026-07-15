import { ApiProperty } from '@nestjs/swagger';

/**
 * Response shapes for the taxonomy endpoints. These mirror the projections in
 * `taxonomy.types.ts` (`CategoryView` & friends) and exist so Swagger can
 * advertise the response schema — the TypeScript interfaces are erased at
 * compile time and are invisible to the OpenAPI generator.
 */

/** A subject category (e.g. Sciences, Languages). */
export class CategoryViewDto {
  @ApiProperty({ description: 'Category id.' })
  id!: string;

  @ApiProperty({ description: 'Localized category name.' })
  name!: string;

  @ApiProperty({ description: 'URL-safe category slug.', example: 'sciences' })
  slug!: string;
}

/** A subject, optionally owned by a category. */
export class SubjectViewDto {
  @ApiProperty({ description: 'Subject id.' })
  id!: string;

  @ApiProperty({ description: 'Localized subject name.' })
  name!: string;

  @ApiProperty({ description: 'URL-safe subject slug.', example: 'mathematics' })
  slug!: string;

  @ApiProperty({ nullable: true, type: String, description: 'Owning category id, if any.' })
  categoryId!: string | null;
}

/** A geographic district used for offline lesson matching. */
export class DistrictViewDto {
  @ApiProperty({ description: 'District id.' })
  id!: string;

  @ApiProperty({ description: 'Localized district name.' })
  name!: string;

  @ApiProperty({ description: 'URL-safe district slug.', example: 'nasimi' })
  slug!: string;
}

/** A language a tutor can teach in. */
export class LanguageViewDto {
  @ApiProperty({ description: 'Language id.' })
  id!: string;

  @ApiProperty({ description: 'Localized language name.' })
  name!: string;

  @ApiProperty({ description: 'Lowercase language code.', example: 'az' })
  code!: string;
}
