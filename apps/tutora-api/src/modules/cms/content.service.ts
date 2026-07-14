import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditCategory, type ContentEntry, ContentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { buildPage, type Paginated } from '@common/pagination/page';
import { AuditService } from '@modules/audit/audit.service';
import type { AuditActorContext } from '@modules/audit/audit.types';
import {
  type ContentEntryView,
  type PublicContentView,
  toContentEntryView,
  toPublicContentView,
} from './cms.types';
import type { CreateContentEntryDto } from './dto/create-content-entry.dto';
import type { ListContentEntriesQueryDto } from './dto/list-content-entries-query.dto';
import type { ListPublicContentQueryDto } from './dto/list-public-content-query.dto';
import type { UpdateContentEntryDto } from './dto/update-content-entry.dto';

/** Default locale for an entry when the client omits one. */
const DEFAULT_LOCALE = 'en';

/**
 * Content management (#67): CRUD over landing sections, FAQ entries, and blog
 * posts. Entries live in `(type, locale)` buckets and are sequenced by `order`.
 * Only `PUBLISHED` entries are served publicly; the first publish stamps
 * `publishedAt`. Every write is attributed to the acting admin (`author`) and
 * mirrored to the audit trail.
 */
@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Admin listing: paginated, filterable by bucket, status, and free text. */
  async list(query: ListContentEntriesQueryDto): Promise<Paginated<ContentEntryView>> {
    const where: Prisma.ContentEntryWhereInput = {};
    if (query.type) where.type = query.type;
    if (query.locale) where.locale = query.locale;
    if (query.status) where.status = query.status;
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { slug: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.contentEntry.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: [{ order: 'asc' }, { updatedAt: 'desc' }],
      }),
      this.prisma.contentEntry.count({ where }),
    ]);

    return buildPage(rows.map(toContentEntryView), total, query.page, query.limit);
  }

  /** Public listing: published entries only, ordered for display. */
  async listPublic(query: ListPublicContentQueryDto): Promise<PublicContentView[]> {
    const where: Prisma.ContentEntryWhereInput = { status: ContentStatus.PUBLISHED };
    if (query.type) where.type = query.type;
    if (query.locale) where.locale = query.locale;

    const rows = await this.prisma.contentEntry.findMany({
      where,
      orderBy: [{ order: 'asc' }, { publishedAt: 'desc' }],
    });
    return rows.map(toPublicContentView);
  }

  /** Creates an entry. A duplicate `(type, locale, slug)` maps to `409`. */
  async create(dto: CreateContentEntryDto, actor: AuditActorContext): Promise<ContentEntryView> {
    const status = dto.status ?? ContentStatus.DRAFT;
    let entry: ContentEntry;
    try {
      entry = await this.prisma.contentEntry.create({
        data: {
          type: dto.type,
          locale: dto.locale ?? DEFAULT_LOCALE,
          slug: dto.slug,
          title: dto.title,
          excerpt: dto.excerpt,
          body: dto.body,
          coverImageUrl: dto.coverImageUrl,
          order: dto.order ?? 0,
          status,
          publishedAt: status === ContentStatus.PUBLISHED ? new Date() : null,
          ...(actor.id ? { author: { connect: { id: actor.id } } } : {}),
        },
      });
    } catch (error) {
      throw this.mapWriteError(error, dto.slug);
    }

    await this.audit.record(actor, {
      category: AuditCategory.ADMIN,
      action: 'content.created',
      entityType: 'ContentEntry',
      entityId: entry.id,
      metadata: { type: entry.type, locale: entry.locale, slug: entry.slug, status: entry.status },
    });

    return toContentEntryView(entry);
  }

  /** Partial update. `type` and `locale` are immutable, so never in the DTO. */
  async update(
    id: string,
    dto: UpdateContentEntryDto,
    actor: AuditActorContext,
  ): Promise<ContentEntryView> {
    const current = await this.findOrThrow(id);

    const data: Prisma.ContentEntryUpdateInput = {};
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.excerpt !== undefined) data.excerpt = dto.excerpt;
    if (dto.body !== undefined) data.body = dto.body;
    if (dto.coverImageUrl !== undefined) data.coverImageUrl = dto.coverImageUrl;
    if (dto.order !== undefined) data.order = dto.order;
    if (dto.status !== undefined) {
      data.status = dto.status;
      // Stamp the first publish; keep the original timestamp on re-publish and
      // when reverting to draft, so it records when the entry first went live.
      if (dto.status === ContentStatus.PUBLISHED && current.publishedAt === null) {
        data.publishedAt = new Date();
      }
    }
    if (actor.id) data.author = { connect: { id: actor.id } };

    let entry: ContentEntry;
    try {
      entry = await this.prisma.contentEntry.update({ where: { id }, data });
    } catch (error) {
      throw this.mapWriteError(error, dto.slug ?? current.slug);
    }

    await this.audit.record(actor, {
      category: AuditCategory.ADMIN,
      action: 'content.updated',
      entityType: 'ContentEntry',
      entityId: entry.id,
      metadata: { type: entry.type, locale: entry.locale, slug: entry.slug, ...this.changed(dto) },
    });

    return toContentEntryView(entry);
  }

  /** Deletes an entry. */
  async remove(id: string, actor: AuditActorContext): Promise<void> {
    const entry = await this.findOrThrow(id);
    await this.prisma.contentEntry.delete({ where: { id } });

    await this.audit.record(actor, {
      category: AuditCategory.ADMIN,
      action: 'content.deleted',
      entityType: 'ContentEntry',
      entityId: id,
      metadata: { type: entry.type, locale: entry.locale, slug: entry.slug },
    });
  }

  /** The fields the update actually changed, for the audit payload. */
  private changed(dto: UpdateContentEntryDto): Prisma.JsonObject {
    const changed: Prisma.JsonObject = {};
    if (dto.slug !== undefined) changed.slug = dto.slug;
    if (dto.title !== undefined) changed.title = dto.title;
    if (dto.order !== undefined) changed.order = dto.order;
    if (dto.status !== undefined) changed.status = dto.status;
    return changed;
  }

  /** Loads an entry or throws a clean `404`. */
  private async findOrThrow(id: string): Promise<ContentEntry> {
    const entry = await this.prisma.contentEntry.findUnique({ where: { id } });
    if (!entry) {
      throw new NotFoundException('Content entry not found');
    }
    return entry;
  }

  /** Maps a unique-constraint violation on `(type, locale, slug)` to a `409`. */
  private mapWriteError(error: unknown, slug: string): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(`Content with slug "${slug}" already exists for this locale`);
    }
    return error instanceof Error ? error : new Error(String(error));
  }
}
