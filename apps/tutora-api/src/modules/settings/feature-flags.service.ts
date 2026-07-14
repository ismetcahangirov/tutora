import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditCategory, type FeatureFlag, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditService } from '@modules/audit/audit.service';
import type { AuditActorContext } from '@modules/audit/audit.types';
import type { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import type { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { type FeatureFlagView, toFeatureFlagView } from './settings.types';

/**
 * Feature-flag administration (#70): master on/off switch plus a 0–100
 * deterministic rollout slice. Every write is attributed to the acting admin
 * (`updatedBy`) and mirrored to the audit trail.
 */
@Injectable()
export class FeatureFlagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** All flags, ordered by key for a stable list. */
  async list(): Promise<FeatureFlagView[]> {
    const flags = await this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
    return flags.map(toFeatureFlagView);
  }

  /** Creates a flag. Rejects a duplicate key with `409`. */
  async create(dto: CreateFeatureFlagDto, actor: AuditActorContext): Promise<FeatureFlagView> {
    let flag: FeatureFlag;
    try {
      flag = await this.prisma.featureFlag.create({
        data: {
          key: dto.key,
          description: dto.description,
          enabled: dto.enabled ?? false,
          rolloutPercentage: dto.rolloutPercentage ?? 0,
          ...(actor.id ? { updatedBy: { connect: { id: actor.id } } } : {}),
        },
      });
    } catch (error) {
      throw this.mapWriteError(error, dto.key);
    }

    await this.audit.record(actor, {
      category: AuditCategory.SYSTEM,
      action: 'feature_flag.created',
      entityType: 'FeatureFlag',
      entityId: flag.id,
      metadata: { key: flag.key, enabled: flag.enabled, rolloutPercentage: flag.rolloutPercentage },
    });

    return toFeatureFlagView(flag);
  }

  /** Partial update. `key` is immutable, so it is never in the DTO. */
  async update(
    id: string,
    dto: UpdateFeatureFlagDto,
    actor: AuditActorContext,
  ): Promise<FeatureFlagView> {
    await this.findOrThrow(id);

    const data: Prisma.FeatureFlagUpdateInput = {};
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.enabled !== undefined) data.enabled = dto.enabled;
    if (dto.rolloutPercentage !== undefined) data.rolloutPercentage = dto.rolloutPercentage;
    if (actor.id) data.updatedBy = { connect: { id: actor.id } };

    const flag = await this.prisma.featureFlag.update({ where: { id }, data });

    await this.audit.record(actor, {
      category: AuditCategory.SYSTEM,
      action: 'feature_flag.updated',
      entityType: 'FeatureFlag',
      entityId: flag.id,
      metadata: { key: flag.key, ...this.changedFields(dto) },
    });

    return toFeatureFlagView(flag);
  }

  /** Deletes a flag. */
  async remove(id: string, actor: AuditActorContext): Promise<void> {
    const flag = await this.findOrThrow(id);
    await this.prisma.featureFlag.delete({ where: { id } });

    await this.audit.record(actor, {
      category: AuditCategory.SYSTEM,
      action: 'feature_flag.deleted',
      entityType: 'FeatureFlag',
      entityId: id,
      metadata: { key: flag.key },
    });
  }

  /** The fields the update actually changed, for the audit payload. */
  private changedFields(dto: UpdateFeatureFlagDto): Prisma.JsonObject {
    const changed: Prisma.JsonObject = {};
    if (dto.description !== undefined) changed.description = dto.description;
    if (dto.enabled !== undefined) changed.enabled = dto.enabled;
    if (dto.rolloutPercentage !== undefined) changed.rolloutPercentage = dto.rolloutPercentage;
    return changed;
  }

  /** Loads a flag or throws a clean `404`. */
  private async findOrThrow(id: string): Promise<FeatureFlag> {
    const flag = await this.prisma.featureFlag.findUnique({ where: { id } });
    if (!flag) {
      throw new NotFoundException('Feature flag not found');
    }
    return flag;
  }

  /** Maps a unique-constraint violation on `key` to a `409`. */
  private mapWriteError(error: unknown, key: string): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(`A feature flag with key "${key}" already exists`);
    }
    return error instanceof Error ? error : new Error(String(error));
  }
}
