import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrorResponses } from '@common/swagger';
import type { PublicContentView } from './cms.types';
import { ContentService } from './content.service';
import { PublicContentViewDto } from './dto/content-response.dto';
import { ListPublicContentQueryDto } from './dto/list-public-content-query.dto';

/**
 * Public content consumed by the marketing site (#67): landing sections, FAQ,
 * and blog posts. No authentication — only `PUBLISHED` entries are exposed, and
 * the payload omits editorial fields.
 */
@ApiTags('content')
@Controller({ path: 'content', version: '1' })
export class ContentPublicController {
  constructor(private readonly content: ContentService) {}

  @Get()
  @ApiOperation({ summary: 'List published content, optionally by type and locale' })
  @ApiOkResponse({
    description: 'Published content entries, ordered for display.',
    type: [PublicContentViewDto],
  })
  @ApiStandardErrorResponses('badRequest')
  list(@Query() query: ListPublicContentQueryDto): Promise<PublicContentView[]> {
    return this.content.listPublic(query);
  }
}
