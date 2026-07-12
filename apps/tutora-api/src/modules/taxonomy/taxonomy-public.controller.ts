import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListSubjectsQueryDto } from './dto/list-subjects-query.dto';
import { TaxonomyService } from './taxonomy.service';
import type { CategoryView, DistrictView, LanguageView, SubjectView } from './taxonomy.types';

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
  categories(): Promise<CategoryView[]> {
    return this.taxonomy.listCategories();
  }

  @Get('subjects')
  @ApiOperation({ summary: 'List subjects, optionally filtered by category' })
  subjects(@Query() query: ListSubjectsQueryDto): Promise<SubjectView[]> {
    return this.taxonomy.listSubjects(query.categoryId);
  }

  @Get('districts')
  @ApiOperation({ summary: 'List all districts' })
  districts(): Promise<DistrictView[]> {
    return this.taxonomy.listDistricts();
  }

  @Get('languages')
  @ApiOperation({ summary: 'List all languages' })
  languages(): Promise<LanguageView[]> {
    return this.taxonomy.listLanguages();
  }
}
