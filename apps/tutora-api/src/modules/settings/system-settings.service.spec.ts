import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { SystemSetting } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditService } from '@modules/audit/audit.service';
import type { AuditActorContext } from '@modules/audit/audit.types';
import { CreateSystemSettingDto } from './dto/create-system-setting.dto';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import { MAX_SETTING_VALUE_BYTES, SystemSettingsService } from './system-settings.service';

const actor: AuditActorContext = { id: 'admin1', email: 'a@x.io', ip: null, userAgent: null };

function settingRow(overrides: Partial<SystemSetting> = {}): SystemSetting {
  return {
    id: 's1',
    key: 'support_email',
    value: 'support@tutora.app',
    description: null,
    updatedById: null,
    createdAt: new Date('2026-07-14T00:00:00Z'),
    updatedAt: new Date('2026-07-14T00:00:00Z'),
    ...overrides,
  };
}

function buildMocks() {
  const prisma = {
    systemSetting: {
      findMany: jest.fn().mockResolvedValue([settingRow()]),
      findUnique: jest.fn().mockResolvedValue(settingRow()),
      create: jest.fn().mockResolvedValue(settingRow()),
      update: jest.fn().mockResolvedValue(settingRow({ value: { enabled: true } })),
      delete: jest.fn().mockResolvedValue(settingRow()),
    },
  };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  return { prisma, audit };
}

async function buildService(mocks: ReturnType<typeof buildMocks>) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      SystemSettingsService,
      { provide: PrismaService, useValue: mocks.prisma },
      { provide: AuditService, useValue: mocks.audit },
    ],
  }).compile();
  return moduleRef.get(SystemSettingsService);
}

function createDto(overrides: Partial<CreateSystemSettingDto> = {}): CreateSystemSettingDto {
  return Object.assign(
    new CreateSystemSettingDto(),
    { key: 'support_email', value: 'x' },
    overrides,
  );
}

describe('SystemSettingsService.create', () => {
  it('stores an arbitrary JSON value and audits the creation', async () => {
    const mocks = buildMocks();
    const service = await buildService(mocks);

    await service.create(createDto({ value: { enabled: false, message: '' } }), actor);

    expect(mocks.prisma.systemSetting.create).toHaveBeenCalledWith({
      data: {
        key: 'support_email',
        value: { enabled: false, message: '' },
        description: undefined,
        updatedBy: { connect: { id: 'admin1' } },
      },
    });
    expect(mocks.audit.record).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({ action: 'system_setting.created' }),
    );
  });

  it('rejects an oversized value with 400 before writing', async () => {
    const mocks = buildMocks();
    const service = await buildService(mocks);

    const huge = 'x'.repeat(MAX_SETTING_VALUE_BYTES + 1);
    await expect(service.create(createDto({ value: huge }), actor)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(mocks.prisma.systemSetting.create).not.toHaveBeenCalled();
  });

  it('accepts falsy JSON values such as 0 and false', async () => {
    const mocks = buildMocks();
    const service = await buildService(mocks);

    await service.create(createDto({ value: 0 }), actor);

    expect(mocks.prisma.systemSetting.create).toHaveBeenCalledWith({
      data: {
        key: 'support_email',
        value: 0,
        description: undefined,
        updatedBy: { connect: { id: 'admin1' } },
      },
    });
  });
});

describe('SystemSettingsService.update', () => {
  it('updates only provided fields and audits whether the value changed', async () => {
    const mocks = buildMocks();
    const service = await buildService(mocks);

    const dto = Object.assign(new UpdateSystemSettingDto(), { description: 'note' });
    await service.update('s1', dto, actor);

    expect(mocks.prisma.systemSetting.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { description: 'note', updatedBy: { connect: { id: 'admin1' } } },
    });
    expect(mocks.audit.record).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({
        action: 'system_setting.updated',
        metadata: { key: 'support_email', valueChanged: false },
      }),
    );
  });

  it('throws 404 when the setting is missing', async () => {
    const mocks = buildMocks();
    mocks.prisma.systemSetting.findUnique.mockResolvedValueOnce(null);
    const service = await buildService(mocks);

    await expect(
      service.update('missing', new UpdateSystemSettingDto(), actor),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('SystemSettingsService.remove', () => {
  it('deletes the setting and records the deletion', async () => {
    const mocks = buildMocks();
    const service = await buildService(mocks);

    await service.remove('s1', actor);

    expect(mocks.prisma.systemSetting.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
    expect(mocks.audit.record).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({ action: 'system_setting.deleted' }),
    );
  });
});
