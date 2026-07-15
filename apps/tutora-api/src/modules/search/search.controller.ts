import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Paginated } from '@common/pagination/page';
import { ApiPaginatedResponse, ApiStandardErrorResponses } from '@common/swagger';
import { TutorSearchItemDto } from './dto/search-response.dto';
import { SearchTutorsQueryDto } from './dto/search-tutors-query.dto';
import { SearchService } from './search.service';
import type { TutorSearchItem } from './search.types';

/**
 * Public tutor search (#31). Unauthenticated: discovery is open, only published
 * profiles ever surface. Detail lookups live in `TutorPublicController`.
 */
@ApiTags('search')
@Controller({ path: 'search', version: '1' })
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get('tutors')
  @ApiOperation({ summary: 'Search published tutors by filters (paginated)' })
  @ApiPaginatedResponse(TutorSearchItemDto)
  @ApiStandardErrorResponses('badRequest')
  searchTutors(@Query() query: SearchTutorsQueryDto): Promise<Paginated<TutorSearchItem>> {
    return this.search.searchTutors(query);
  }
}
