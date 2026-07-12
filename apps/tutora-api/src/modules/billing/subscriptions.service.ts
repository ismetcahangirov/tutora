import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus, PlanTier, Prisma, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { buildPage, type Paginated } from '@common/pagination/page';
import {
  ADMIN_SUBSCRIPTION_INCLUDE,
  SUBSCRIPTION_INCLUDE,
  toAdminSubscriptionView,
  toSubscriptionView,
} from './billing.mapper';
import { resolveEntitlements } from './plan-entitlements';
import type { AdminSubscriptionView, EntitlementSummary, SubscriptionView } from './billing.types';
import type { ListSubscriptionsQueryDto } from './dto/list-subscriptions-query.dto';
import type { SubscribeDto } from './dto/subscribe.dto';

/** Length of one billing period granted when a subscription is taken out. */
const BILLING_PERIOD_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Statuses that keep a subscription in force regardless of the period end. */
const IN_FORCE_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PAST_DUE,
];

/**
 * Subscriptions and entitlement resolution (#36). A user holds at most one
 * effective subscription; subscribing supersedes the previous one and opens a
 * fresh period. Entitlements are derived from the effective plan and exposed
 * through {@link getSummary} — the reusable API other modules read to enforce
 * FREE vs PRO limits.
 */
@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Subscribes the caller to the active plan for `tier`. Supersedes any
   * effective subscription (a user holds one at a time), opens a fresh billing
   * period, and records a PENDING payment for a priced plan — settled later by a
   * gateway webhook or an admin. Free plans record no payment.
   */
  async subscribe(userId: string, dto: SubscribeDto): Promise<SubscriptionView> {
    const plan = await this.prisma.plan.findFirst({ where: { tier: dto.tier, isActive: true } });
    if (!plan) {
      throw new NotFoundException('Plan not available');
    }

    const current = await this.findEffective(userId);
    if (current && current.plan.tier === dto.tier) {
      throw new ConflictException('Already subscribed to this plan');
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + BILLING_PERIOD_DAYS * DAY_MS);
    const isPriced = Number(plan.priceMonthly) > 0;

    const subscription = await this.prisma.$transaction(async (tx) => {
      // End whatever the user held so exactly one subscription is ever effective.
      await tx.subscription.updateMany({
        where: this.effectiveWhere(userId, now),
        data: { status: SubscriptionStatus.EXPIRED, currentPeriodEnd: now },
      });

      const created = await tx.subscription.create({
        data: {
          userId,
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
        include: SUBSCRIPTION_INCLUDE,
      });

      if (isPriced) {
        await tx.payment.create({
          data: {
            userId,
            subscriptionId: created.id,
            amount: plan.priceMonthly,
            currency: plan.currency,
            status: PaymentStatus.PENDING,
            provider: dto.provider ?? null,
            providerRef: dto.providerRef ?? null,
          },
        });
      }
      return created;
    });

    return toSubscriptionView(subscription);
  }

  /**
   * Cancels the caller's subscription at period end: it stays in force (access
   * continues) until `currentPeriodEnd`, then lapses. 404 when there is nothing
   * to cancel.
   */
  async cancel(userId: string): Promise<SubscriptionView> {
    const current = await this.findEffective(userId);
    if (!current || current.status === SubscriptionStatus.CANCELED) {
      throw new NotFoundException('No active subscription to cancel');
    }
    const updated = await this.prisma.subscription.update({
      where: { id: current.id },
      data: { status: SubscriptionStatus.CANCELED },
      include: SUBSCRIPTION_INCLUDE,
    });
    return toSubscriptionView(updated);
  }

  /** The caller's effective billing standing: entitlements + backing subscription. */
  async getSummary(userId: string): Promise<EntitlementSummary> {
    const current = await this.findEffective(userId);
    if (current) {
      return {
        tier: current.plan.tier,
        entitlements: resolveEntitlements(current.plan.tier, current.plan.entitlements),
        subscription: toSubscriptionView(current),
      };
    }
    // Implicit FREE: honour the FREE plan's stored overrides if one is configured.
    const freePlan = await this.prisma.plan.findUnique({ where: { tier: PlanTier.FREE } });
    return {
      tier: PlanTier.FREE,
      entitlements: resolveEntitlements(PlanTier.FREE, freePlan?.entitlements ?? null),
      subscription: null,
    };
  }

  /** Admin: every subscription, filterable by status/user, newest first. */
  async listAll(query: ListSubscriptionsQueryDto): Promise<Paginated<AdminSubscriptionView>> {
    const where: Prisma.SubscriptionWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.userId) where.userId = query.userId;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.subscription.findMany({
        where,
        include: ADMIN_SUBSCRIPTION_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.subscription.count({ where }),
    ]);
    return buildPage(rows.map(toAdminSubscriptionView), total, query.page, query.limit);
  }

  /**
   * A subscription is effective if it is ACTIVE/PAST_DUE, or CANCELED but still
   * inside its paid period (cancel-at-period-end). EXPIRED and lapsed CANCELED
   * subscriptions are ignored.
   */
  private effectiveWhere(userId: string, now: Date): Prisma.SubscriptionWhereInput {
    return {
      userId,
      OR: [
        { status: { in: IN_FORCE_STATUSES } },
        { status: SubscriptionStatus.CANCELED, currentPeriodEnd: { gt: now } },
      ],
    };
  }

  private async findEffective(userId: string) {
    return this.prisma.subscription.findFirst({
      where: this.effectiveWhere(userId, new Date()),
      orderBy: { createdAt: 'desc' },
      include: SUBSCRIPTION_INCLUDE,
    });
  }
}
