import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import type { PlanView } from './billing.types';

/**
 * Public subscription-plan catalogue (#36). Unauthenticated — pricing is shown
 * before sign-in. Only active plans are exposed here.
 */
@ApiTags('plans')
@Controller({ path: 'plans', version: '1' })
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Get()
  @ApiOperation({ summary: 'List active subscription plans (public)' })
  list(): Promise<PlanView[]> {
    return this.plans.listActive();
  }
}
