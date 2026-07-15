import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { ApiStandardErrorResponses } from '@common/swagger';
import { EnqueuedJobViewDto, JobScheduleViewDto } from './dto/jobs-response.dto';
import { JobsService } from './jobs.service';
import { MaintenanceJob, type EnqueuedJobView, type JobScheduleView } from './jobs.types';

/**
 * Admin operations surface for background jobs (#38). Lets operators inspect the
 * cron schedule and trigger any maintenance job on demand (e.g. re-run a cleanup
 * or digest after an incident) without waiting for the next scheduled fire.
 */
@ApiTags('admin: jobs')
@ApiBearerAuth('bearer')
@ApiStandardErrorResponses('unauthorized', 'forbidden')
@Controller({ path: 'admin/jobs', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminJobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  @ApiOperation({ summary: 'List maintenance jobs and their cron schedules' })
  @ApiOkResponse({
    description: 'Maintenance jobs and their schedules.',
    type: [JobScheduleViewDto],
  })
  list(): JobScheduleView[] {
    return this.jobs.listSchedules();
  }

  @Post(':job/run')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Enqueue a maintenance job to run now' })
  @ApiParam({ name: 'job', enum: MaintenanceJob, enumName: 'MaintenanceJob' })
  @ApiOkResponse({ description: 'The job was enqueued.', type: EnqueuedJobViewDto })
  @ApiStandardErrorResponses('badRequest')
  run(
    @Param('job', new ParseEnumPipe(MaintenanceJob)) job: MaintenanceJob,
  ): Promise<EnqueuedJobView> {
    return this.jobs.enqueue(job);
  }
}
