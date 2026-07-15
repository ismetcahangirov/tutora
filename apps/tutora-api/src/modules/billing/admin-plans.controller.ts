import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { ApiStandardErrorResponses } from '@common/swagger';
import { PlansService } from './plans.service';
import type { PlanView } from './billing.types';
import { PlanViewDto } from './dto/billing-response.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

/** Admin management of the subscription-plan catalogue (#36). */
@ApiTags('admin: plans')
@ApiBearerAuth('bearer')
@ApiStandardErrorResponses('unauthorized', 'forbidden')
@Controller({ path: 'admin/plans', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminPlansController {
  constructor(private readonly plans: PlansService) {}

  @Get()
  @ApiOperation({ summary: 'List all plans, including retired ones' })
  @ApiOkResponse({ description: 'All plans in the catalogue.', type: [PlanViewDto] })
  list(): Promise<PlanView[]> {
    return this.plans.listAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a plan' })
  @ApiCreatedResponse({ description: 'The created plan.', type: PlanViewDto })
  @ApiStandardErrorResponses('badRequest', 'conflict')
  create(@Body() dto: CreatePlanDto): Promise<PlanView> {
    return this.plans.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a plan (price, entitlements, availability)' })
  @ApiParam({ name: 'id', description: 'Plan id.' })
  @ApiOkResponse({ description: 'The updated plan.', type: PlanViewDto })
  @ApiStandardErrorResponses('badRequest', 'notFound')
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto): Promise<PlanView> {
    return this.plans.update(id, dto);
  }
}
