import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { PlansService } from './plans.service';
import type { PlanView } from './billing.types';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

/** Admin management of the subscription-plan catalogue (#36). */
@ApiTags('admin: plans')
@ApiBearerAuth('bearer')
@Controller({ path: 'admin/plans', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminPlansController {
  constructor(private readonly plans: PlansService) {}

  @Get()
  @ApiOperation({ summary: 'List all plans, including retired ones' })
  list(): Promise<PlanView[]> {
    return this.plans.listAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a plan' })
  create(@Body() dto: CreatePlanDto): Promise<PlanView> {
    return this.plans.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a plan (price, entitlements, availability)' })
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto): Promise<PlanView> {
    return this.plans.update(id, dto);
  }
}
