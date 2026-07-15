import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { ApiStandardErrorResponses } from '@common/swagger';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateDistrictDto } from './dto/create-district.dto';
import { CreateLanguageDto } from './dto/create-language.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';
import {
  CategoryViewDto,
  DistrictViewDto,
  LanguageViewDto,
  SubjectViewDto,
} from './dto/taxonomy-response.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateDistrictDto } from './dto/update-district.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { TaxonomyService } from './taxonomy.service';
import type { CategoryView, DistrictView, LanguageView, SubjectView } from './taxonomy.types';

/** Admin-only taxonomy management. Every route requires the ADMIN role. */
@ApiTags('admin: taxonomy')
@ApiBearerAuth('bearer')
@ApiStandardErrorResponses('unauthorized', 'forbidden')
@Controller({ path: 'admin/taxonomy', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminTaxonomyController {
  constructor(private readonly taxonomy: TaxonomyService) {}

  // ---------- Categories ----------

  @Post('categories')
  @ApiOperation({ summary: 'Create a category' })
  @ApiCreatedResponse({ description: 'The created category.', type: CategoryViewDto })
  @ApiStandardErrorResponses('badRequest', 'conflict')
  createCategory(@Body() dto: CreateCategoryDto): Promise<CategoryView> {
    return this.taxonomy.createCategory(dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'id', description: 'Category id.' })
  @ApiOkResponse({ description: 'The updated category.', type: CategoryViewDto })
  @ApiStandardErrorResponses('badRequest', 'notFound', 'conflict')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto): Promise<CategoryView> {
    return this.taxonomy.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({ name: 'id', description: 'Category id.' })
  @ApiNoContentResponse({ description: 'The category was deleted.' })
  @ApiStandardErrorResponses('notFound')
  async deleteCategory(@Param('id') id: string): Promise<void> {
    await this.taxonomy.deleteCategory(id);
  }

  // ---------- Subjects ----------

  @Post('subjects')
  @ApiOperation({ summary: 'Create a subject' })
  @ApiCreatedResponse({ description: 'The created subject.', type: SubjectViewDto })
  @ApiStandardErrorResponses('badRequest', 'conflict')
  createSubject(@Body() dto: CreateSubjectDto): Promise<SubjectView> {
    return this.taxonomy.createSubject(dto);
  }

  @Patch('subjects/:id')
  @ApiOperation({ summary: 'Update a subject' })
  @ApiParam({ name: 'id', description: 'Subject id.' })
  @ApiOkResponse({ description: 'The updated subject.', type: SubjectViewDto })
  @ApiStandardErrorResponses('badRequest', 'notFound', 'conflict')
  updateSubject(@Param('id') id: string, @Body() dto: UpdateSubjectDto): Promise<SubjectView> {
    return this.taxonomy.updateSubject(id, dto);
  }

  @Delete('subjects/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a subject' })
  @ApiParam({ name: 'id', description: 'Subject id.' })
  @ApiNoContentResponse({ description: 'The subject was deleted.' })
  @ApiStandardErrorResponses('notFound')
  async deleteSubject(@Param('id') id: string): Promise<void> {
    await this.taxonomy.deleteSubject(id);
  }

  // ---------- Districts ----------

  @Post('districts')
  @ApiOperation({ summary: 'Create a district' })
  @ApiCreatedResponse({ description: 'The created district.', type: DistrictViewDto })
  @ApiStandardErrorResponses('badRequest', 'conflict')
  createDistrict(@Body() dto: CreateDistrictDto): Promise<DistrictView> {
    return this.taxonomy.createDistrict(dto);
  }

  @Patch('districts/:id')
  @ApiOperation({ summary: 'Update a district' })
  @ApiParam({ name: 'id', description: 'District id.' })
  @ApiOkResponse({ description: 'The updated district.', type: DistrictViewDto })
  @ApiStandardErrorResponses('badRequest', 'notFound', 'conflict')
  updateDistrict(@Param('id') id: string, @Body() dto: UpdateDistrictDto): Promise<DistrictView> {
    return this.taxonomy.updateDistrict(id, dto);
  }

  @Delete('districts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a district' })
  @ApiParam({ name: 'id', description: 'District id.' })
  @ApiNoContentResponse({ description: 'The district was deleted.' })
  @ApiStandardErrorResponses('notFound')
  async deleteDistrict(@Param('id') id: string): Promise<void> {
    await this.taxonomy.deleteDistrict(id);
  }

  // ---------- Languages ----------

  @Post('languages')
  @ApiOperation({ summary: 'Create a language' })
  @ApiCreatedResponse({ description: 'The created language.', type: LanguageViewDto })
  @ApiStandardErrorResponses('badRequest', 'conflict')
  createLanguage(@Body() dto: CreateLanguageDto): Promise<LanguageView> {
    return this.taxonomy.createLanguage(dto);
  }

  @Patch('languages/:id')
  @ApiOperation({ summary: 'Update a language' })
  @ApiParam({ name: 'id', description: 'Language id.' })
  @ApiOkResponse({ description: 'The updated language.', type: LanguageViewDto })
  @ApiStandardErrorResponses('badRequest', 'notFound', 'conflict')
  updateLanguage(@Param('id') id: string, @Body() dto: UpdateLanguageDto): Promise<LanguageView> {
    return this.taxonomy.updateLanguage(id, dto);
  }

  @Delete('languages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a language' })
  @ApiParam({ name: 'id', description: 'Language id.' })
  @ApiNoContentResponse({ description: 'The language was deleted.' })
  @ApiStandardErrorResponses('notFound')
  async deleteLanguage(@Param('id') id: string): Promise<void> {
    await this.taxonomy.deleteLanguage(id);
  }
}
