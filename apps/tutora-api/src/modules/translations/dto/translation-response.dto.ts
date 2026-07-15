import { ApiProperty } from '@nestjs/swagger';
import { TranslationValuesDto } from './translation-values.dto';

/**
 * Response shapes for the translations endpoints. These mirror the projections
 * in `translations.types.ts` (`TranslationView`, `PublicTranslationsMap`,
 * `LocaleTranslationsMap`) and exist so Swagger can advertise the response
 * schema — the TypeScript types are erased at compile time and are invisible to
 * the OpenAPI generator.
 */

/** Admin-facing projection of a translation — the full editable record. */
export class TranslationViewDto {
  @ApiProperty({ description: 'Translation id.' })
  id!: string;

  @ApiProperty({ description: 'Grouping namespace.', example: 'search' })
  namespace!: string;

  @ApiProperty({ description: 'Dot- or underscore-joined key.', example: 'filter.district' })
  key!: string;

  @ApiProperty({ nullable: true, type: String, description: 'Editorial description, if any.' })
  description!: string | null;

  @ApiProperty({
    type: TranslationValuesDto,
    description: 'Per-locale copy; each supported locale is optional.',
  })
  values!: TranslationValuesDto;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Last-editing admin id, if attributed.',
  })
  updatedById!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

/**
 * The full public catalog: every supported locale's flat `namespace.key → value`
 * map, keyed by locale. Served when no `locale` query param is supplied.
 */
export class PublicTranslationsMapDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: 'Azerbaijani `namespace.key → value` map.',
  })
  az!: Record<string, string>;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: 'English `namespace.key → value` map.',
  })
  en!: Record<string, string>;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: 'Russian `namespace.key → value` map.',
  })
  ru!: Record<string, string>;
}
