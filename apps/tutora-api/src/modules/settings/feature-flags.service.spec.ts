import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type FeatureFlag, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditService } from '@modules/audit/audit.service';
import type { AuditActorContext } from '@modules/audit/audit.types';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { FeatureFlagsService } from './feature-flags.service';

const actor: AuditActorContext = { id: 'admin1', email: 'a@x.io', ip: null, userAgent: null };

function flagRow(overrides: Partial<FeatureFlag> = {}): FeatureFlag {
  return {
    id: 'f1',
    key: 'in_app_payments',
    description: null,
    enabled: false,
    rolloutPercentage: 0,
    updatedById: null,
    createdAt: new Date('2026-07-14T00:00:00Z'),
    updatedAt: new Date('2026-07-14T00:00:00Z'),
    ...overrides,
  };
}

function buildMocks() {
  const prisma = {
    featureFlag: {
      findMany: jest.fn().mockResolvedValue([flagRow()]),
      findUnique: jest.fn().mockResolvedValue(flagRow()),
      create: jest.fn().mockResolvedValue(flagRow()),
      update: jest.fn().mockResolvedValue(flagRow({ enabled: true })),
      delete: jest.fn().mockResolvedValue(flagRow()),
    },
  };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  return { prisma, audit };
}

async function buildService(mocks: ReturnType<typeof buildMocks>) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      FeatureFlagsService,
      { provide: PrismaService, useValue: mocks.prisma },
      { provide: AuditService, useValue: mocks.audit },
    ],
  }).compile();
  return moduleRef.get(FeatureFlagsService);
}

function createDto(overrides: Partial<CreateFeatureFlagDto> = {}): CreateFeatureFlagDto {
  return Object.assign(new CreateFeatureFlagDto(), { key: 'in_app_payments' }, overrides);
}

describe('FeatureFlagsService.create', () => {
  it('creates a flag, attributes the editor, and records an audit entry', async () => {
    const mocks = buildMocks();
    const service = await buildService(mocks);

    await service.create(createDto({ enabled: true, rolloutPercentage: 50 }), actor);

    expect(mocks.prisma.featureFlag.create).toHaveBeenCalledWith({
      data: {
        key: 'in_app_payments',
        description: undefined,
        enabled: true,
        rolloutPercentage: 50,
        updatedBy: { connect: { id: 'admin1' } },
      },
    });
    expect(mocks.audit.record).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({ action: 'feature_flag.created', entityType: 'FeatureFlag' }),
    );
  });

  it('defaults enabled/rollout when omitted', async () => {
    const mocks = buildMocks();
    const service = await buildService(mocks);

    await service.create(createDto(), actor);

    expect(mocks.prisma.featureFlag.create).toHaveBeenCalledWith({
      data: {
        key: 'in_app_payments',
        description: undefined,
        enabled: false,
        rolloutPercentage: 0,
        updatedBy: { connect: { id: 'admin1' } },
      },
    });
  });

  it('maps a duplicate key to a 409 and does not audit', async () => {
    const mocks = buildMocks();
    mocks.prisma.featureFlag.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '6' }),
    );
    const service = await buildService(mocks);

    await expect(service.create(createDto(), actor)).rejects.toBeInstanceOf(ConflictException);
    expect(mocks.audit.record).not.toHaveBeenCalled();
  });
});

describe('FeatureFlagsService.update', () => {
  it('writes only the provided fields and audits the change', async () => {
    const mocks = buildMocks();
    const service = await buildService(mocks);

    const dto = Object.assign(new UpdateFeatureFlagDto(), { enabled: true });
    await service.update('f1', dto, actor);

    expect(mocks.prisma.featureFlag.update).toHaveBeenCalledWith({
      where: { id: 'f1' },
      data: { enabled: true, updatedBy: { connect: { id: 'admin1' } } },
    });
    expect(mocks.audit.record).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({ action: 'feature_flag.updated' }),
    );
  });

  it('throws 404 when the flag is missing', async () => {
    const mocks = buildMocks();
    mocks.prisma.featureFlag.findUnique.mockResolvedValueOnce(null);
    const service = await buildService(mocks);

    await expect(
      service.update('missing', new UpdateFeatureFlagDto(), actor),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.prisma.featureFlag.update).not.toHaveBeenCalled();
  });
});

describe('FeatureFlagsService.remove', () => {
  it('deletes the flag and records the deletion', async () => {
    const mocks = buildMocks();
    const service = await buildService(mocks);

    await service.remove('f1', actor);

    expect(mocks.prisma.featureFlag.delete).toHaveBeenCalledWith({ where: { id: 'f1' } });
    expect(mocks.audit.record).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({ action: 'feature_flag.deleted' }),
    );
  });
});
