import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListDistrictsQueryDto } from './dto/list-districts-query.dto';
import { ListSubjectsQueryDto } from './dto/list-subjects-query.dto';
import {
  CategoryViewDto,
  CityViewDto,
  DistrictViewDto,
  LanguageViewDto,
  SubjectViewDto,
} from './dto/taxonomy-response.dto';
import { TaxonomyService } from './taxonomy.service';
import type {
  CategoryView,
  CityView,
  DistrictView,
  LanguageView,
  SubjectView,
} from './taxonomy.types';

/**
 * Public reference data used by filter UIs and tutor profile assignment. No
 * authentication — this is non-sensitive, read-only taxonomy.
 */
@ApiTags('taxonomy')
@Controller({ version: '1' })
export class TaxonomyPublicController {
  constructor(private readonly taxonomy: TaxonomyService) {}

  @Get('categories')
  @ApiOperation({ summary: 'List all categories' })
  @ApiOkResponse({ description: 'All categories.', type: [CategoryViewDto] })
  categories(): Promise<CategoryView[]> {
    return this.taxonomy.listCategories();
  }

  @Get('subjects')
  @ApiOperation({ summary: 'List subjects, optionally filtered by category' })
  @ApiOkResponse({ description: 'Matching subjects.', type: [SubjectViewDto] })
  subjects(@Query() query: ListSubjectsQueryDto): Promise<SubjectView[]> {
    return this.taxonomy.listSubjects(query.categoryId);
  }

  @Get('cities')
  @ApiOperation({ summary: 'List all cities' })
  @ApiOkResponse({ description: 'All cities.', type: [CityViewDto] })
  cities(): Promise<CityView[]> {
    return this.taxonomy.listCities();
  }

  @Get('districts')
  @ApiOperation({ summary: 'List districts, optionally filtered by city' })
  @ApiOkResponse({ description: 'Matching districts.', type: [DistrictViewDto] })
  districts(@Query() query: ListDistrictsQueryDto): Promise<DistrictView[]> {
    return this.taxonomy.listDistricts(query.cityId);
  }

  @Get('languages')
  @ApiOperation({ summary: 'List all languages' })
  @ApiOkResponse({ description: 'All languages.', type: [LanguageViewDto] })
  languages(): Promise<LanguageView[]> {
    return this.taxonomy.listLanguages();
  }
}
