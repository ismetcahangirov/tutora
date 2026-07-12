import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import type { Paginated } from '@common/pagination/page';
import { PaymentsService } from './payments.service';
import { SubscriptionsService } from './subscriptions.service';
import type { AdminPaymentView, AdminSubscriptionView } from './billing.types';
import { ListPaymentsQueryDto } from './dto/list-payments-query.dto';
import { ListSubscriptionsQueryDto } from './dto/list-subscriptions-query.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

/** Admin oversight of subscriptions and payments (#36). */
@ApiTags('admin: billing')
@ApiBearerAuth('bearer')
@Controller({ path: 'admin', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminBillingController {
  constructor(
    private readonly subscriptions: SubscriptionsService,
    private readonly payments: PaymentsService,
  ) {}

  @Get('subscriptions')
  @ApiOperation({ summary: 'List subscriptions (paginated, filterable)' })
  listSubscriptions(
    @Query() query: ListSubscriptionsQueryDto,
  ): Promise<Paginated<AdminSubscriptionView>> {
    return this.subscriptions.listAll(query);
  }

  @Get('payments')
  @ApiOperation({ summary: 'List payments (paginated, filterable)' })
  listPayments(@Query() query: ListPaymentsQueryDto): Promise<Paginated<AdminPaymentView>> {
    return this.payments.listAll(query);
  }

  @Patch('payments/:id/status')
  @ApiOperation({ summary: 'Settle a payment’s status (webhook / manual reconciliation)' })
  updatePaymentStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
  ): Promise<AdminPaymentView> {
    return this.payments.updateStatus(id, dto);
  }
}
