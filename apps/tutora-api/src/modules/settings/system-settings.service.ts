import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditCategory, Prisma, type SystemSetting } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditService } from '@modules/audit/audit.service';
import type { AuditActorContext } from '@modules/audit/audit.types';
import type { CreateSystemSettingDto } from './dto/create-system-setting.dto';
import type { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import { type SystemSettingView, toSystemSettingView } from './settings.types';

/** Upper bound on a setting's serialized JSON, guarding against oversized blobs. */
export const MAX_SETTING_VALUE_BYTES = 16 * 1024;

/**
 * System-settings administration (#70): a key → JSON store for global config.
 * Every write is attributed to the acting admin (`updatedBy`) and mirrored to
 * the audit trail. Values are bounded in size but otherwise schema-free.
 */
@Injectable()
export class SystemSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** All settings, ordered by key for a stable list. */
  async list(): Promise<SystemSettingView[]> {
    const settings = await this.prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
    return settings.map(toSystemSettingView);
  }

  /** Creates a setting. Rejects a duplicate key with `409`. */
  async create(dto: CreateSystemSettingDto, actor: AuditActorContext): Promise<SystemSettingView> {
    const value = this.assertBounded(dto.value);

    let setting: SystemSetting;
    try {
      setting = await this.prisma.systemSetting.create({
        data: {
          key: dto.key,
          value,
          description: dto.description,
          ...(actor.id ? { updatedBy: { connect: { id: actor.id } } } : {}),
        },
      });
    } catch (error) {
      throw this.mapWriteError(error, dto.key);
    }

    await this.audit.record(actor, {
      category: AuditCategory.SYSTEM,
      action: 'system_setting.created',
      entityType: 'SystemSetting',
      entityId: setting.id,
      metadata: { key: setting.key },
    });

    return toSystemSettingView(setting);
  }

  /** Partial update of value and/or description. `key` is immutable. */
  async update(
    id: string,
    dto: UpdateSystemSettingDto,
    actor: AuditActorContext,
  ): Promise<SystemSettingView> {
    const existing = await this.findOrThrow(id);

    const data: Prisma.SystemSettingUpdateInput = {};
    if (dto.value !== undefined) data.value = this.assertBounded(dto.value);
    if (dto.description !== undefined) data.description = dto.description;
    if (actor.id) data.updatedBy = { connect: { id: actor.id } };

    const setting = await this.prisma.systemSetting.update({ where: { id }, data });

    await this.audit.record(actor, {
      category: AuditCategory.SYSTEM,
      action: 'system_setting.updated',
      entityType: 'SystemSetting',
      entityId: setting.id,
      metadata: { key: existing.key, valueChanged: dto.value !== undefined },
    });

    return toSystemSettingView(setting);
  }

  /** Deletes a setting. */
  async remove(id: string, actor: AuditActorContext): Promise<void> {
    const setting = await this.findOrThrow(id);
    await this.prisma.systemSetting.delete({ where: { id } });

    await this.audit.record(actor, {
      category: AuditCategory.SYSTEM,
      action: 'system_setting.deleted',
      entityType: 'SystemSetting',
      entityId: id,
      metadata: { key: setting.key },
    });
  }

  /** Narrows arbitrary input to a JSON value and enforces the size cap. */
  private assertBounded(value: unknown): Prisma.InputJsonValue {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) {
      // JSON.stringify returns undefined for functions/symbols — not valid JSON.
      throw new BadRequestException('Setting value must be JSON-serializable');
    }
    if (serialized.length > MAX_SETTING_VALUE_BYTES) {
      throw new BadRequestException('Setting value is too large');
    }
    return value as Prisma.InputJsonValue;
  }

  /** Loads a setting or throws a clean `404`. */
  private async findOrThrow(id: string): Promise<SystemSetting> {
    const setting = await this.prisma.systemSetting.findUnique({ where: { id } });
    if (!setting) {
      throw new NotFoundException('System setting not found');
    }
    return setting;
  }

  /** Maps a unique-constraint violation on `key` to a `409`. */
  private mapWriteError(error: unknown, key: string): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(`A setting with key "${key}" already exists`);
    }
    return error instanceof Error ? error : new Error(String(error));
  }
}
