import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditCategory, Prisma, type Translation } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { SUPPORTED_LANGUAGES } from '@/i18n/i18n.config';
import { buildPage, type Paginated } from '@common/pagination/page';
import { AuditService } from '@modules/audit/audit.service';
import type { AuditActorContext } from '@modules/audit/audit.types';
import {
  type LocaleTranslationsMap,
  type PublicTranslationsMap,
  toPublicKey,
  type TranslationValues,
  type TranslationView,
  toTranslationValues,
  toTranslationView,
} from './translations.types';
import type { CreateTranslationDto } from './dto/create-translation.dto';
import type { ListPublicTranslationsQueryDto } from './dto/list-public-translations-query.dto';
import type { ListTranslationsQueryDto } from './dto/list-translations-query.dto';
import type { TranslationValuesDto } from './dto/translation-values.dto';
import type { UpdateTranslationDto } from './dto/update-translation.dto';

/**
 * Translation management (#85): CRUD over the over-the-air localization layer.
 * Each entry is a `(namespace, key)` pair carrying per-locale copy; the public
 * endpoint flattens published entries into `namespace.key → value` maps clients
 * merge over their static catalogs. Every write is attributed to the acting
 * admin and mirrored to the audit trail (#71).
 */
@Injectable()
export class TranslationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Admin listing: paginated, filterable by namespace and free-text key match. */
  async list(query: ListTranslationsQueryDto): Promise<Paginated<TranslationView>> {
    const where: Prisma.TranslationWhereInput = {};
    if (query.namespace) where.namespace = query.namespace;
    if (query.q) where.key = { contains: query.q, mode: 'insensitive' };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.translation.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: [{ namespace: 'asc' }, { key: 'asc' }],
      }),
      this.prisma.translation.count({ where }),
    ]);

    return buildPage(rows.map(toTranslationView), total, query.page, query.limit);
  }

  /**
   * Public read: every entry flattened into per-locale `namespace.key → value`
   * maps. A `locale` narrows the response to that language's map.
   */
  async listPublic(
    query: ListPublicTranslationsQueryDto,
  ): Promise<PublicTranslationsMap | LocaleTranslationsMap> {
    const rows = await this.prisma.translation.findMany({
      orderBy: [{ namespace: 'asc' }, { key: 'asc' }],
    });
    const maps = this.buildPublicMaps(rows);
    return query.locale ? maps[query.locale] : maps;
  }

  /** Creates an entry. A duplicate `(namespace, key)` maps to `409`. */
  async create(dto: CreateTranslationDto, actor: AuditActorContext): Promise<TranslationView> {
    const values = this.normalizeValues(dto.values);
    let row: Translation;
    try {
      row = await this.prisma.translation.create({
        data: {
          namespace: dto.namespace,
          key: dto.key,
          description: dto.description,
          values,
          ...(actor.id ? { updatedBy: { connect: { id: actor.id } } } : {}),
        },
      });
    } catch (error) {
      throw this.mapWriteError(error, toPublicKey(dto.namespace, dto.key));
    }

    await this.audit.record(actor, {
      category: AuditCategory.ADMIN,
      action: 'translation.created',
      entityType: 'Translation',
      entityId: row.id,
      metadata: { namespace: row.namespace, key: row.key, locales: Object.keys(values) },
    });

    return toTranslationView(row);
  }

  /** Partial update. `namespace` and `key` are immutable, so never in the DTO. */
  async update(
    id: string,
    dto: UpdateTranslationDto,
    actor: AuditActorContext,
  ): Promise<TranslationView> {
    const current = await this.findOrThrow(id);

    const values = dto.values !== undefined ? this.normalizeValues(dto.values) : undefined;
    const data: Prisma.TranslationUpdateInput = {};
    if (dto.description !== undefined) data.description = dto.description;
    if (values !== undefined) data.values = values;
    if (actor.id) data.updatedBy = { connect: { id: actor.id } };

    const row = await this.prisma.translation.update({ where: { id }, data });

    await this.audit.record(actor, {
      category: AuditCategory.ADMIN,
      action: 'translation.updated',
      entityType: 'Translation',
      entityId: row.id,
      metadata: {
        namespace: current.namespace,
        key: current.key,
        ...(values !== undefined ? { locales: Object.keys(values) } : {}),
      },
    });

    return toTranslationView(row);
  }

  /** Deletes an entry. */
  async remove(id: string, actor: AuditActorContext): Promise<void> {
    const row = await this.findOrThrow(id);
    await this.prisma.translation.delete({ where: { id } });

    await this.audit.record(actor, {
      category: AuditCategory.ADMIN,
      action: 'translation.deleted',
      entityType: 'Translation',
      entityId: id,
      metadata: { namespace: row.namespace, key: row.key },
    });
  }

  /** Flattens rows into a `namespace.key → value` map per supported locale. */
  private buildPublicMaps(rows: Translation[]): PublicTranslationsMap {
    const maps = Object.fromEntries(
      SUPPORTED_LANGUAGES.map((locale) => [locale, {}]),
    ) as PublicTranslationsMap;

    for (const row of rows) {
      const values = toTranslationValues(row.values);
      const publicKey = toPublicKey(row.namespace, row.key);
      for (const locale of SUPPORTED_LANGUAGES) {
        const value = values[locale];
        if (value !== undefined) maps[locale][publicKey] = value;
      }
    }
    return maps;
  }

  /** Keeps only supported locales whose value is a non-empty string. */
  private normalizeValues(values: TranslationValuesDto | undefined): TranslationValues {
    const result: TranslationValues = {};
    if (!values) return result;
    for (const locale of SUPPORTED_LANGUAGES) {
      const value = values[locale];
      if (typeof value === 'string' && value.length > 0) result[locale] = value;
    }
    return result;
  }

  /** Loads an entry or throws a clean `404`. */
  private async findOrThrow(id: string): Promise<Translation> {
    const row = await this.prisma.translation.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Translation not found');
    }
    return row;
  }

  /** Maps a unique-constraint violation on `(namespace, key)` to a `409`. */
  private mapWriteError(error: unknown, publicKey: string): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(`Translation "${publicKey}" already exists`);
    }
    return error instanceof Error ? error : new Error(String(error));
  }
}
