import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type ContentEntry, ContentStatus, ContentType, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditService } from '@modules/audit/audit.service';
import type { AuditActorContext } from '@modules/audit/audit.types';
import { ContentService } from './content.service';
import { CreateContentEntryDto } from './dto/create-content-entry.dto';
import { UpdateContentEntryDto } from './dto/update-content-entry.dto';

const actor: AuditActorContext = { id: 'admin1', email: 'a@x.io', ip: null, userAgent: null };

function entryRow(overrides: Partial<ContentEntry> = {}): ContentEntry {
  return {
    id: 'c1',
    type: ContentType.FAQ,
    locale: 'en',
    slug: 'how-it-works',
    title: 'How it works',
    excerpt: null,
    body: 'Body copy.',
    coverImageUrl: null,
    order: 0,
    status: ContentStatus.DRAFT,
    publishedAt: null,
    authorId: null,
    createdAt: new Date('2026-07-15T00:00:00Z'),
    updatedAt: new Date('2026-07-15T00:00:00Z'),
    ...overrides,
  };
}

function buildMocks() {
  const prisma = {
    contentEntry: {
      findMany: jest.fn().mockResolvedValue([entryRow()]),
      findUnique: jest.fn().mockResolvedValue(entryRow()),
      count: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockResolvedValue(entryRow()),
      update: jest.fn().mockResolvedValue(entryRow()),
      delete: jest.fn().mockResolvedValue(entryRow()),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((ops: unknown[]) => Promise.all(ops));
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  return { prisma, audit };
}

async function buildService(mocks: ReturnType<typeof buildMocks>) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      ContentService,
      { provide: PrismaService, useValue: mocks.prisma },
      { provide: AuditService, useValue: mocks.audit },
    ],
  }).compile();
  return moduleRef.get(ContentService);
}

function createDto(overrides: Partial<CreateContentEntryDto> = {}): CreateContentEntryDto {
  return Object.assign(new CreateContentEntryDto(), {
    type: ContentType.FAQ,
    slug: 'how-it-works',
    title: 'How it works',
    body: 'Body copy.',
    ...overrides,
  });
}

describe('ContentService.create', () => {
  it('defaults locale/order/status, leaves publishedAt null for a draft, and audits', async () => {
    const mocks = buildMocks();
    const service = await buildService(mocks);

    await service.create(createDto(), actor);

    expect(mocks.prisma.contentEntry.create).toHaveBeenCalledWith({
      data: {
        type: ContentType.FAQ,
        locale: 'en',
        slug: 'how-it-works',
        title: 'How it works',
        excerpt: undefined,
        body: 'Body copy.',
        coverImageUrl: undefined,
        order: 0,
        status: ContentStatus.DRAFT,
        publishedAt: null,
        author: { connect: { id: 'admin1' } },
      },
    });
    expect(mocks.audit.record).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({ action: 'content.created', entityType: 'ContentEntry' }),
    );
  });

  it('stamps publishedAt when created already published', async () => {
    const mocks = buildMocks();
    const service = await buildService(mocks);

    await service.create(createDto({ status: ContentStatus.PUBLISHED }), actor);

    const [arg] = mocks.prisma.contentEntry.create.mock.calls[0] as [
      { data: { publishedAt: Date | null } },
    ];
    expect(arg.data.publishedAt).toBeInstanceOf(Date);
  });

  it('maps a duplicate slug to a 409 and does not audit', async () => {
    const mocks = buildMocks();
    mocks.prisma.contentEntry.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '6' }),
    );
    const service = await buildService(mocks);

    await expect(service.create(createDto(), actor)).rejects.toBeInstanceOf(ConflictException);
    expect(mocks.audit.record).not.toHaveBeenCalled();
  });
});

describe('ContentService.update', () => {
  it('writes only provided fields and stamps publishedAt on first publish', async () => {
    const mocks = buildMocks();
    mocks.prisma.contentEntry.findUnique.mockResolvedValueOnce(entryRow({ publishedAt: null }));
    const service = await buildService(mocks);

    const dto = Object.assign(new UpdateContentEntryDto(), { status: ContentStatus.PUBLISHED });
    await service.update('c1', dto, actor);

    const [arg] = mocks.prisma.contentEntry.update.mock.calls[0] as [
      {
        where: { id: string };
        data: { status: ContentStatus; publishedAt?: Date; author: unknown };
      },
    ];
    expect(arg.where).toEqual({ id: 'c1' });
    expect(arg.data.status).toBe(ContentStatus.PUBLISHED);
    expect(arg.data.publishedAt).toBeInstanceOf(Date);
    expect(arg.data.author).toEqual({ connect: { id: 'admin1' } });
    expect(mocks.audit.record).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({ action: 'content.updated' }),
    );
  });

  it('keeps the original publishedAt when re-publishing an already-published entry', async () => {
    const mocks = buildMocks();
    const firstPublished = new Date('2026-07-10T00:00:00Z');
    mocks.prisma.contentEntry.findUnique.mockResolvedValueOnce(
      entryRow({ status: ContentStatus.DRAFT, publishedAt: firstPublished }),
    );
    const service = await buildService(mocks);

    const dto = Object.assign(new UpdateContentEntryDto(), { status: ContentStatus.PUBLISHED });
    await service.update('c1', dto, actor);

    const [arg] = mocks.prisma.contentEntry.update.mock.calls[0] as [
      { data: { publishedAt?: Date } },
    ];
    expect(arg.data.publishedAt).toBeUndefined();
  });

  it('throws 404 when the entry is missing', async () => {
    const mocks = buildMocks();
    mocks.prisma.contentEntry.findUnique.mockResolvedValueOnce(null);
    const service = await buildService(mocks);

    await expect(
      service.update('missing', new UpdateContentEntryDto(), actor),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.prisma.contentEntry.update).not.toHaveBeenCalled();
  });
});

describe('ContentService.listPublic', () => {
  it('queries only published entries, ordered for display', async () => {
    const mocks = buildMocks();
    const service = await buildService(mocks);

    await service.listPublic({ type: ContentType.BLOG_POST, locale: 'en' });

    expect(mocks.prisma.contentEntry.findMany).toHaveBeenCalledWith({
      where: { status: ContentStatus.PUBLISHED, type: ContentType.BLOG_POST, locale: 'en' },
      orderBy: [{ order: 'asc' }, { publishedAt: 'desc' }],
    });
  });
});

describe('ContentService.remove', () => {
  it('deletes the entry and records the deletion', async () => {
    const mocks = buildMocks();
    const service = await buildService(mocks);

    await service.remove('c1', actor);

    expect(mocks.prisma.contentEntry.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    expect(mocks.audit.record).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({ action: 'content.deleted' }),
    );
  });
});
