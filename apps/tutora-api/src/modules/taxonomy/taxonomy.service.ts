import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { CreateDistrictDto } from './dto/create-district.dto';
import type { CreateLanguageDto } from './dto/create-language.dto';
import type { CreateSubjectDto } from './dto/create-subject.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';
import type { UpdateDistrictDto } from './dto/update-district.dto';
import type { UpdateLanguageDto } from './dto/update-language.dto';
import type { UpdateSubjectDto } from './dto/update-subject.dto';
import type { CategoryView, DistrictView, LanguageView, SubjectView } from './taxonomy.types';

const CATEGORY_FIELDS = { id: true, name: true, slug: true } satisfies Prisma.CategorySelect;
const SUBJECT_FIELDS = {
  id: true,
  name: true,
  slug: true,
  categoryId: true,
} satisfies Prisma.SubjectSelect;
const DISTRICT_FIELDS = { id: true, name: true, slug: true } satisfies Prisma.DistrictSelect;
const LANGUAGE_FIELDS = { id: true, name: true, code: true } satisfies Prisma.LanguageSelect;

/**
 * Reference data shared across the marketplace: categories, subjects, districts
 * and languages. Read endpoints are public (filter options, tutor assignment);
 * writes are admin-only. Kept in one service since each entity is a thin CRUD.
 */
@Injectable()
export class TaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Categories ----------

  listCategories(): Promise<CategoryView[]> {
    return this.prisma.category.findMany({ select: CATEGORY_FIELDS, orderBy: { name: 'asc' } });
  }

  async createCategory(dto: CreateCategoryDto): Promise<CategoryView> {
    return this.write('Category', () =>
      this.prisma.category.create({ data: dto, select: CATEGORY_FIELDS }),
    );
  }

  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<CategoryView> {
    return this.write('Category', () =>
      this.prisma.category.update({ where: { id }, data: dto, select: CATEGORY_FIELDS }),
    );
  }

  async deleteCategory(id: string): Promise<void> {
    await this.write('Category', () => this.prisma.category.delete({ where: { id } }));
  }

  // ---------- Subjects ----------

  listSubjects(categoryId?: string): Promise<SubjectView[]> {
    return this.prisma.subject.findMany({
      where: categoryId ? { categoryId } : undefined,
      select: SUBJECT_FIELDS,
      orderBy: { name: 'asc' },
    });
  }

  async createSubject(dto: CreateSubjectDto): Promise<SubjectView> {
    return this.write('Subject', () =>
      this.prisma.subject.create({ data: dto, select: SUBJECT_FIELDS }),
    );
  }

  async updateSubject(id: string, dto: UpdateSubjectDto): Promise<SubjectView> {
    return this.write('Subject', () =>
      this.prisma.subject.update({ where: { id }, data: dto, select: SUBJECT_FIELDS }),
    );
  }

  async deleteSubject(id: string): Promise<void> {
    await this.write('Subject', () => this.prisma.subject.delete({ where: { id } }));
  }

  // ---------- Districts ----------

  listDistricts(): Promise<DistrictView[]> {
    return this.prisma.district.findMany({ select: DISTRICT_FIELDS, orderBy: { name: 'asc' } });
  }

  async createDistrict(dto: CreateDistrictDto): Promise<DistrictView> {
    return this.write('District', () =>
      this.prisma.district.create({ data: dto, select: DISTRICT_FIELDS }),
    );
  }

  async updateDistrict(id: string, dto: UpdateDistrictDto): Promise<DistrictView> {
    return this.write('District', () =>
      this.prisma.district.update({ where: { id }, data: dto, select: DISTRICT_FIELDS }),
    );
  }

  async deleteDistrict(id: string): Promise<void> {
    await this.write('District', () => this.prisma.district.delete({ where: { id } }));
  }

  // ---------- Languages ----------

  listLanguages(): Promise<LanguageView[]> {
    return this.prisma.language.findMany({ select: LANGUAGE_FIELDS, orderBy: { name: 'asc' } });
  }

  async createLanguage(dto: CreateLanguageDto): Promise<LanguageView> {
    return this.write('Language', () =>
      this.prisma.language.create({ data: dto, select: LANGUAGE_FIELDS }),
    );
  }

  async updateLanguage(id: string, dto: UpdateLanguageDto): Promise<LanguageView> {
    return this.write('Language', () =>
      this.prisma.language.update({ where: { id }, data: dto, select: LANGUAGE_FIELDS }),
    );
  }

  async deleteLanguage(id: string): Promise<void> {
    await this.write('Language', () => this.prisma.language.delete({ where: { id } }));
  }

  /**
   * Runs a write and maps Prisma's constraint errors to clean HTTP responses:
   * duplicate slug/code → 409, missing row → 404, bad foreign key → 400.
   */
  private async write<T>(entity: string, op: () => Promise<T>): Promise<T> {
    try {
      return await op();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(`${entity} with this slug or code already exists`);
        }
        if (error.code === 'P2025') {
          throw new NotFoundException(`${entity} not found`);
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('Referenced category does not exist');
        }
      }
      throw error;
    }
  }
}
