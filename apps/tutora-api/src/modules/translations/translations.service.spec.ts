import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma, type Translation } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditService } from '@modules/audit/audit.service';
import type { AuditActorContext } from '@modules/audit/audit.types';
import { TranslationsService } from './translations.service';
import { CreateTranslationDto } from './dto/create-translation.dto';
import { UpdateTranslationDto } from './dto/update-translation.dto';

const actor: AuditActorContext = { id: 'admin1', email: 'a@x.io', ip: null, userAgent: null };

function row(overrides: Partial<Translation> = {}): Translation {
  return {
    id: 't1',
    namespace: 'search',
    key: 'filter.district',
    description: null,
    values: { az: 'Rayon', en: 'District', ru: 'Район' },
    updatedById: null,
    createdAt: new Date('2026-07-15T00:00:00Z'),
    updatedAt: new Date('2026-07-15T00:00:00Z'),
    ...overrides,
  };
}

function buildMocks() {
  const prisma = {
    translation: {
      findMany: jest.fn().mockResolvedValue([row()]),
      findUnique: jest.fn().mockResolvedValue(row()),
      count: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockResolvedValue(row()),
      update: jest.fn().mockResolvedValue(row()),
      delete: jest.fn().mockResolvedValue(row()),
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
      TranslationsService,
      { provide: PrismaService, useValue: mocks.prisma },
      { provide: AuditService, useValue: mocks.audit },
    ],
  }).compile();
  return moduleRef.get(TranslationsService);
}

function createDto(overrides: Partial<CreateTranslationDto> = {}): CreateTranslationDto {
  return Object.assign(new CreateTranslationDto(), {
    namespace: 'search',
    key: 'filter.district',
    ...overrides,
  });
}

describe('TranslationsService.create', () => {
  it('defaults values to an empty map, connects the editor, and audits', async () => {
    const mocks = buildMocks();
    const service = await buildService(mocks);

    await service.create(createDto(), actor);

    expect(mocks.prisma.translation.create).toHaveBeenCalledWith({
      data: {
        namespace: 'search',
        key: 'filter.district',
        description: undefined,
        values: {},
        updatedBy: { connect: { id: 'admin1' } },
      },
    });
    expect(mocks.audit.record).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({ action: 'translation.created', entityType: 'Translation' }),
    );
  });

  it('normalizes values, dropping empty and unsupported locales', async () => {
    const mocks = buildMocks();
    const service = await buildService(mocks);

    await service.create(
      createDto({ values: { az: 'Rayon', en: '', ru: 'Район', fr: 'x' } as never }),
      actor,
    );

    const [arg] = mocks.prisma.translation.create.mock.calls[0] as [
      { data: { values: Record<string, string> } },
    ];
    expect(arg.data.values).toEqual({ az: 'Rayon', ru: 'Район' });
  });

  it('maps a duplicate (namespace, key) to a 409 and does not audit', async () => {
    const mocks = buildMocks();
    mocks.prisma.translation.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '6' }),
    );
    const service = await buildService(mocks);

    await expect(service.create(createDto(), actor)).rejects.toBeInstanceOf(ConflictException);
    expect(mocks.audit.record).not.toHaveBeenCalled();
  });
});

describe('TranslationsService.update', () => {
  it('writes only provided fields, connects the editor, and audits', async () => {
    const mocks = buildMocks();
    const service = await buildService(mocks);

    const dto = Object.assign(new UpdateTranslationDto(), { description: 'Search filter label' });
    await service.update('t1', dto, actor);

    const [arg] = mocks.prisma.translation.update.mock.calls[0] as [
      {
        where: { id: string };
        data: { description?: string; values?: unknown; updatedBy: unknown };
      },
    ];
    expect(arg.where).toEqual({ id: 't1' });
    expect(arg.data.description).toBe('Search filter label');
    expect(arg.data.values).toBeUndefined();
    expect(arg.data.updatedBy).toEqual({ connect: { id: 'admin1' } });
    expect(mocks.audit.record).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({ action: 'translation.updated' }),
    );
  });

  it('throws 404 when the entry is missing', async () => {
    const mocks = buildMocks();
    mocks.prisma.translation.findUnique.mockResolvedValueOnce(null);
    const service = await buildService(mocks);

    await expect(
      service.update('missing', new UpdateTranslationDto(), actor),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.prisma.translation.update).not.toHaveBeenCalled();
  });
});

describe('TranslationsService.listPublic', () => {
  it('flattens entries into per-locale namespace.key maps', async () => {
    const mocks = buildMocks();
    mocks.prisma.translation.findMany.mockResolvedValueOnce([
      row({ namespace: 'search', key: 'filter.district', values: { az: 'Rayon', en: 'District' } }),
      row({ id: 't2', namespace: 'common', key: 'save', values: { az: 'Yadda saxla' } }),
    ]);
    const service = await buildService(mocks);

    const result = await service.listPublic({});

    expect(result).toEqual({
      az: { 'search.filter.district': 'Rayon', 'common.save': 'Yadda saxla' },
      en: { 'search.filter.district': 'District' },
      ru: {},
    });
  });

  it('returns a single locale map when a locale is requested', async () => {
    const mocks = buildMocks();
    mocks.prisma.translation.findMany.mockResolvedValueOnce([
      row({ namespace: 'common', key: 'save', values: { az: 'Yadda saxla', en: 'Save' } }),
    ]);
    const service = await buildService(mocks);

    const result = await service.listPublic({ locale: 'en' });

    expect(result).toEqual({ 'common.save': 'Save' });
  });
});

describe('TranslationsService.remove', () => {
  it('deletes the entry and records the deletion', async () => {
    const mocks = buildMocks();
    const service = await buildService(mocks);

    await service.remove('t1', actor);

    expect(mocks.prisma.translation.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
    expect(mocks.audit.record).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({ action: 'translation.deleted' }),
    );
  });
});
