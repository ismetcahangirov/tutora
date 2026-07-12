import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { toPlanView } from './billing.mapper';
import type { PlanView } from './billing.types';
import type { CreatePlanDto } from './dto/create-plan.dto';
import type { UpdatePlanDto } from './dto/update-plan.dto';

/**
 * The subscription-plan catalogue (#36). Public callers read active plans;
 * admins manage the full catalogue. A plan's `entitlements` overrides are stored
 * verbatim and resolved against the tier baseline on read (see `toPlanView`).
 */
@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public catalogue: active plans only, cheapest first. */
  async listActive(): Promise<PlanView[]> {
    const plans = await this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
    });
    return plans.map(toPlanView);
  }

  /** Every plan, including retired ones (admin). */
  async listAll(): Promise<PlanView[]> {
    const plans = await this.prisma.plan.findMany({ orderBy: { priceMonthly: 'asc' } });
    return plans.map(toPlanView);
  }

  async create(dto: CreatePlanDto): Promise<PlanView> {
    try {
      const plan = await this.prisma.plan.create({
        data: {
          tier: dto.tier,
          name: dto.name,
          priceMonthly: dto.priceMonthly,
          ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
          ...(dto.entitlements !== undefined ? { entitlements: { ...dto.entitlements } } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });
      return toPlanView(plan);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A plan for this tier already exists');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdatePlanDto): Promise<PlanView> {
    await this.findOrThrow(id);
    const data: Prisma.PlanUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.priceMonthly !== undefined) data.priceMonthly = dto.priceMonthly;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.entitlements !== undefined) {
      data.entitlements = { ...dto.entitlements };
    }
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const plan = await this.prisma.plan.update({ where: { id }, data });
    return toPlanView(plan);
  }

  private async findOrThrow(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return plan;
  }
}
