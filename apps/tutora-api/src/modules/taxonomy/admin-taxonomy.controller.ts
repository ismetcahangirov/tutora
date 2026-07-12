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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateDistrictDto } from './dto/create-district.dto';
import { CreateLanguageDto } from './dto/create-language.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateDistrictDto } from './dto/update-district.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { TaxonomyService } from './taxonomy.service';
import type { CategoryView, DistrictView, LanguageView, SubjectView } from './taxonomy.types';

/** Admin-only taxonomy management. Every route requires the ADMIN role. */
@ApiTags('admin: taxonomy')
@ApiBearerAuth('bearer')
@Controller({ path: 'admin/taxonomy', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminTaxonomyController {
  constructor(private readonly taxonomy: TaxonomyService) {}

  // ---------- Categories ----------

  @Post('categories')
  @ApiOperation({ summary: 'Create a category' })
  createCategory(@Body() dto: CreateCategoryDto): Promise<CategoryView> {
    return this.taxonomy.createCategory(dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto): Promise<CategoryView> {
    return this.taxonomy.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a category' })
  async deleteCategory(@Param('id') id: string): Promise<void> {
    await this.taxonomy.deleteCategory(id);
  }

  // ---------- Subjects ----------

  @Post('subjects')
  @ApiOperation({ summary: 'Create a subject' })
  createSubject(@Body() dto: CreateSubjectDto): Promise<SubjectView> {
    return this.taxonomy.createSubject(dto);
  }

  @Patch('subjects/:id')
  @ApiOperation({ summary: 'Update a subject' })
  updateSubject(@Param('id') id: string, @Body() dto: UpdateSubjectDto): Promise<SubjectView> {
    return this.taxonomy.updateSubject(id, dto);
  }

  @Delete('subjects/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a subject' })
  async deleteSubject(@Param('id') id: string): Promise<void> {
    await this.taxonomy.deleteSubject(id);
  }

  // ---------- Districts ----------

  @Post('districts')
  @ApiOperation({ summary: 'Create a district' })
  createDistrict(@Body() dto: CreateDistrictDto): Promise<DistrictView> {
    return this.taxonomy.createDistrict(dto);
  }

  @Patch('districts/:id')
  @ApiOperation({ summary: 'Update a district' })
  updateDistrict(@Param('id') id: string, @Body() dto: UpdateDistrictDto): Promise<DistrictView> {
    return this.taxonomy.updateDistrict(id, dto);
  }

  @Delete('districts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a district' })
  async deleteDistrict(@Param('id') id: string): Promise<void> {
    await this.taxonomy.deleteDistrict(id);
  }

  // ---------- Languages ----------

  @Post('languages')
  @ApiOperation({ summary: 'Create a language' })
  createLanguage(@Body() dto: CreateLanguageDto): Promise<LanguageView> {
    return this.taxonomy.createLanguage(dto);
  }

  @Patch('languages/:id')
  @ApiOperation({ summary: 'Update a language' })
  updateLanguage(@Param('id') id: string, @Body() dto: UpdateLanguageDto): Promise<LanguageView> {
    return this.taxonomy.updateLanguage(id, dto);
  }

  @Delete('languages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a language' })
  async deleteLanguage(@Param('id') id: string): Promise<void> {
    await this.taxonomy.deleteLanguage(id);
  }
}
