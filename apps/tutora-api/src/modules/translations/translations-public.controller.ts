import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiStandardErrorResponses } from '@common/swagger';
import type { LocaleTranslationsMap, PublicTranslationsMap } from './translations.types';
import { TranslationsService } from './translations.service';
import { ListPublicTranslationsQueryDto } from './dto/list-public-translations-query.dto';
import { PublicTranslationsMapDto } from './dto/translation-response.dto';

/**
 * Public translations consumed by the apps (#85): flat `namespace.key → value`
 * maps clients merge over their static catalogs for over-the-air copy. No
 * authentication — the payload is display copy, not privileged data.
 */
@ApiTags('translations')
@Controller({ path: 'translations', version: '1' })
export class TranslationsPublicController {
  constructor(private readonly translations: TranslationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get translation copy, optionally for a single locale' })
  @ApiExtraModels(PublicTranslationsMapDto)
  @ApiOkResponse({
    description:
      'Every locale’s `namespace.key → value` map, or a single locale’s flat map when `locale` is given.',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(PublicTranslationsMapDto) },
        { type: 'object', additionalProperties: { type: 'string' } },
      ],
    },
  })
  @ApiStandardErrorResponses('badRequest')
  list(
    @Query() query: ListPublicTranslationsQueryDto,
  ): Promise<PublicTranslationsMap | LocaleTranslationsMap> {
    return this.translations.listPublic(query);
  }
}
