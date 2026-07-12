import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus, Prisma, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { buildPage, type Paginated } from '@common/pagination/page';
import type { PaginationQueryDto } from '@common/pagination/pagination-query.dto';
import { ADMIN_PAYMENT_INCLUDE, toAdminPaymentView, toPaymentView } from './billing.mapper';
import { canTransitionPayment } from './payment-status';
import type { AdminPaymentView, PaymentView } from './billing.types';
import type { ListPaymentsQueryDto } from './dto/list-payments-query.dto';
import type { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

/**
 * Payment / transaction history and reconciliation (#36). Users read their own
 * transactions; admins list all of them and settle a payment's status. Settling
 * moves the linked subscription in the same transaction so billing state stays
 * consistent.
 */
@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  /** The caller's own transactions, newest first. */
  async listForUser(userId: string, query: PaginationQueryDto): Promise<Paginated<PaymentView>> {
    const where: Prisma.PaymentWhereInput = { userId };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.payment.count({ where }),
    ]);
    return buildPage(rows.map(toPaymentView), total, query.page, query.limit);
  }

  /** Admin: every payment, filterable by status/user, newest first. */
  async listAll(query: ListPaymentsQueryDto): Promise<Paginated<AdminPaymentView>> {
    const where: Prisma.PaymentWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.userId) where.userId = query.userId;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        include: ADMIN_PAYMENT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.payment.count({ where }),
    ]);
    return buildPage(rows.map(toAdminPaymentView), total, query.page, query.limit);
  }

  /**
   * Reconciles a payment's status (gateway webhook or admin). Only legal
   * transitions are accepted; the linked subscription follows in the same
   * transaction:
   *   FAILED    → subscription PAST_DUE
   *   REFUNDED  → subscription CANCELED
   * A terminal (EXPIRED) subscription is never revived by a late settlement.
   */
  async updateStatus(id: string, dto: UpdatePaymentStatusDto): Promise<AdminPaymentView> {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.status === dto.status) {
      return toAdminPaymentView(await this.findAdminRow(id));
    }
    if (!canTransitionPayment(payment.status, dto.status)) {
      throw new BadRequestException(
        `Cannot change payment from ${payment.status} to ${dto.status}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.payment.update({
        where: { id },
        data: {
          status: dto.status,
          ...(dto.providerRef !== undefined ? { providerRef: dto.providerRef } : {}),
        },
        include: ADMIN_PAYMENT_INCLUDE,
      });

      if (row.subscriptionId) {
        if (dto.status === PaymentStatus.FAILED) {
          await tx.subscription.updateMany({
            where: {
              id: row.subscriptionId,
              status: { notIn: [SubscriptionStatus.EXPIRED, SubscriptionStatus.CANCELED] },
            },
            data: { status: SubscriptionStatus.PAST_DUE },
          });
        } else if (dto.status === PaymentStatus.REFUNDED) {
          await tx.subscription.updateMany({
            where: { id: row.subscriptionId, status: { not: SubscriptionStatus.EXPIRED } },
            data: { status: SubscriptionStatus.CANCELED },
          });
        }
      }
      return row;
    });
    return toAdminPaymentView(updated);
  }

  private async findAdminRow(id: string) {
    const row = await this.prisma.payment.findUnique({
      where: { id },
      include: ADMIN_PAYMENT_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException('Payment not found');
    }
    return row;
  }
}
