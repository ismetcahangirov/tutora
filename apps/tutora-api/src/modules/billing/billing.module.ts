import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { AdminBillingController } from './admin-billing.controller';
import { AdminPlansController } from './admin-plans.controller';
import { BillingController } from './billing.controller';
import { PlansController } from './plans.controller';
import { PaymentsService } from './payments.service';
import { PlansService } from './plans.service';
import { SubscriptionsService } from './subscriptions.service';

/**
 * Subscription plans, entitlements and payments (#36). Plans are the catalogue;
 * a Subscription binds a user to a plan for a billing period; Payments record
 * the money movement. Entitlements are derived from the effective plan and are
 * the single source of truth for FREE vs PRO limits.
 *
 * Exports `SubscriptionsService` so feature modules can resolve a user's
 * entitlements (`getSummary`) when enforcing those limits. Imports `AuthModule`
 * for the route guards.
 */
@Module({
  imports: [AuthModule],
  controllers: [PlansController, AdminPlansController, BillingController, AdminBillingController],
  providers: [PlansService, SubscriptionsService, PaymentsService],
  exports: [SubscriptionsService],
})
export class BillingModule {}
