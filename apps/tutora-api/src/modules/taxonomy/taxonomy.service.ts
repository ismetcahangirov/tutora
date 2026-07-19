import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CacheService } from '@common/cache/cache.service';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { CreateCityDto } from './dto/create-city.dto';
import type { CreateDistrictDto } from './dto/create-district.dto';
import type { CreateLanguageDto } from './dto/create-language.dto';
import type { CreateSubjectDto } from './dto/create-subject.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';
import type { UpdateCityDto } from './dto/update-city.dto';
import type { UpdateDistrictDto } from './dto/update-district.dto';
import type { UpdateLanguageDto } from './dto/update-language.dto';
import type { UpdateSubjectDto } from './dto/update-subject.dto';
import type {
  CategoryView,
  CityView,
  DistrictView,
  LanguageView,
  SubjectView,
} from './taxonomy.types';

const CATEGORY_FIELDS = { id: true, name: true, slug: true } satisfies Prisma.CategorySelect;
const SUBJECT_FIELDS = {
  id: true,
  name: true,
  slug: true,
  categoryId: true,
} satisfies Prisma.SubjectSelect;
const CITY_FIELDS = { id: true, name: true, slug: true } satisfies Prisma.CitySelect;
const DISTRICT_FIELDS = {
  id: true,
  name: true,
  slug: true,
  cityId: true,
} satisfies Prisma.DistrictSelect;
const LANGUAGE_FIELDS = { id: true, name: true, code: true } satisfies Prisma.LanguageSelect;

// Every key lives under this namespace so a single prefix invalidates the lot.
const CACHE_PREFIX = 'taxonomy:';
// Reference data changes rarely (admin-only), so a long TTL is safe; writes
// invalidate eagerly, so staleness is bounded by the write, not the TTL.
const CACHE_TTL_SECONDS = 60 * 60;

/**
 * Reference data shared across the marketplace: categories, subjects, districts
 * and languages. Read endpoints are public (filter options, tutor assignment);
 * writes are admin-only. Kept in one service since each entity is a thin CRUD.
 *
 * Reads are hot (every filter UI hits them) and the data is small and rarely
 * changes, so lists are cached in Redis and served cache-aside. Any write
 * invalidates the whole `taxonomy:` namespace — writes are infrequent admin ops,
 * so a coarse, always-correct invalidation beats per-key bookkeeping.
 */
@Injectable()
export class TaxonomyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  // ---------- Categories ----------

  listCategories(): Promise<CategoryView[]> {
    return this.cache.getOrSet(`${CACHE_PREFIX}categories`, CACHE_TTL_SECONDS, () =>
      this.prisma.category.findMany({ select: CATEGORY_FIELDS, orderBy: { name: 'asc' } }),
    );
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
    const key = categoryId ? `${CACHE_PREFIX}subjects:${categoryId}` : `${CACHE_PREFIX}subjects`;
    return this.cache.getOrSet(key, CACHE_TTL_SECONDS, () =>
      this.prisma.subject.findMany({
        where: categoryId ? { categoryId } : undefined,
        select: SUBJECT_FIELDS,
        orderBy: { name: 'asc' },
      }),
    );
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

  // ---------- Cities ----------

  listCities(): Promise<CityView[]> {
    return this.cache.getOrSet(`${CACHE_PREFIX}cities`, CACHE_TTL_SECONDS, () =>
      this.prisma.city.findMany({ select: CITY_FIELDS, orderBy: { name: 'asc' } }),
    );
  }

  async createCity(dto: CreateCityDto): Promise<CityView> {
    return this.write('City', () => this.prisma.city.create({ data: dto, select: CITY_FIELDS }));
  }

  async updateCity(id: string, dto: UpdateCityDto): Promise<CityView> {
    return this.write('City', () =>
      this.prisma.city.update({ where: { id }, data: dto, select: CITY_FIELDS }),
    );
  }

  async deleteCity(id: string): Promise<void> {
    await this.write('City', () => this.prisma.city.delete({ where: { id } }));
  }

  // ---------- Districts ----------

  listDistricts(cityId?: string): Promise<DistrictView[]> {
    const key = cityId ? `${CACHE_PREFIX}districts:${cityId}` : `${CACHE_PREFIX}districts`;
    return this.cache.getOrSet(key, CACHE_TTL_SECONDS, () =>
      this.prisma.district.findMany({
        where: cityId ? { cityId } : undefined,
        select: DISTRICT_FIELDS,
        orderBy: { name: 'asc' },
      }),
    );
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
    return this.cache.getOrSet(`${CACHE_PREFIX}languages`, CACHE_TTL_SECONDS, () =>
      this.prisma.language.findMany({ select: LANGUAGE_FIELDS, orderBy: { name: 'asc' } }),
    );
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
   * Runs a write, then invalidates the taxonomy cache so the next read reflects
   * it. Maps Prisma's constraint errors to clean HTTP responses: duplicate
   * slug/code → 409, missing row → 404, bad foreign key → 400.
   */
  private async write<T>(entity: string, op: () => Promise<T>): Promise<T> {
    try {
      const result = await op();
      await this.cache.deleteByPrefix(CACHE_PREFIX);
      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(`${entity} with this slug or code already exists`);
        }
        if (error.code === 'P2025') {
          throw new NotFoundException(`${entity} not found`);
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('Referenced parent record does not exist');
        }
      }
      throw error;
    }
  }
}
