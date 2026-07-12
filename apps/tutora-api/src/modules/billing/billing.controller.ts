import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import type { AuthenticatedUser } from '@modules/auth/types/auth.types';
import type { Paginated } from '@common/pagination/page';
import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';
import { PaymentsService } from './payments.service';
import { SubscriptionsService } from './subscriptions.service';
import type { EntitlementSummary, PaymentView, SubscriptionView } from './billing.types';
import { SubscribeDto } from './dto/subscribe.dto';

/** The signed-in user's own subscription, entitlements and payment history (#36). */
@ApiTags('billing')
@ApiBearerAuth('bearer')
@Controller({ path: 'billing', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN)
export class BillingController {
  constructor(
    private readonly subscriptions: SubscriptionsService,
    private readonly payments: PaymentsService,
  ) {}

  @Get('subscription')
  @ApiOperation({ summary: "The caller's current subscription and entitlements" })
  summary(@CurrentUser() user: AuthenticatedUser): Promise<EntitlementSummary> {
    return this.subscriptions.getSummary(user.id);
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to a plan' })
  subscribe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubscribeDto,
  ): Promise<SubscriptionView> {
    return this.subscriptions.subscribe(user.id, dto);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel the caller’s subscription at period end' })
  cancel(@CurrentUser() user: AuthenticatedUser): Promise<SubscriptionView> {
    return this.subscriptions.cancel(user.id);
  }

  @Get('payments')
  @ApiOperation({ summary: 'The caller’s payment history (paginated, newest first)' })
  listPayments(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ): Promise<Paginated<PaymentView>> {
    return this.payments.listForUser(user.id, query);
  }
}
