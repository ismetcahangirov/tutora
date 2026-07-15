import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { LocaleTranslationsMap, PublicTranslationsMap } from './translations.types';
import { TranslationsService } from './translations.service';
import { ListPublicTranslationsQueryDto } from './dto/list-public-translations-query.dto';

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
  list(
    @Query() query: ListPublicTranslationsQueryDto,
  ): Promise<PublicTranslationsMap | LocaleTranslationsMap> {
    return this.translations.listPublic(query);
  }
}
