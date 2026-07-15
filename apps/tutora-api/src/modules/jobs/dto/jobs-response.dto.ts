import { ApiProperty } from '@nestjs/swagger';
import { MaintenanceJob } from '../jobs.types';

/**
 * Response shapes for the admin jobs endpoints. These mirror the `JobScheduleView`
 * and `EnqueuedJobView` projections in `jobs.types.ts` and exist so Swagger can
 * advertise the response schema — the TypeScript interfaces are erased at compile
 * time and are invisible to the OpenAPI generator.
 */

/** A scheduled maintenance job paired with the cron pattern it fires on. */
export class JobScheduleViewDto {
  @ApiProperty({ enum: MaintenanceJob, enumName: 'MaintenanceJob' })
  job!: MaintenanceJob;

  @ApiProperty({
    description: 'Standard 5-field cron pattern (server timezone).',
    example: '0 3 * * *',
  })
  pattern!: string;
}

/** The identifier of a maintenance job enqueued on demand. */
export class EnqueuedJobViewDto {
  @ApiProperty({
    nullable: true,
    type: String,
    description: 'BullMQ job id, or null if the queue did not assign one.',
  })
  id!: string | null;

  @ApiProperty({ enum: MaintenanceJob, enumName: 'MaintenanceJob' })
  job!: MaintenanceJob;
}
