import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MAINTENANCE_QUEUE } from './jobs.constants';
import { MaintenanceJob, type JobResult } from './jobs.types';
import { CleanupService } from './handlers/cleanup.service';
import { ApplicationExpiryService } from './handlers/application-expiry.service';
import { TutorDigestService } from './handlers/tutor-digest.service';

/**
 * The maintenance queue worker (#38).
 *
 * Routes each job to its handler by name and returns the handler's result so
 * BullMQ stores it with the completed job (observability). Failures propagate so
 * BullMQ applies the queue's retry/backoff policy. The worker connects to Redis
 * on instantiation, so it is only wired in real app boots — never in unit tests.
 */
@Processor(MAINTENANCE_QUEUE)
export class JobsProcessor extends WorkerHost {
  private readonly logger = new Logger(JobsProcessor.name);

  constructor(
    private readonly cleanup: CleanupService,
    private readonly applicationExpiry: ApplicationExpiryService,
    private readonly tutorDigest: TutorDigestService,
  ) {
    super();
  }

  async process(job: Job<unknown, JobResult, string>): Promise<JobResult> {
    // BullMQ types job names as plain strings; we only enqueue MaintenanceJob
    // values, and the default branch guards any name that slips through.
    switch (job.name as MaintenanceJob) {
      case MaintenanceJob.Cleanup:
        return this.cleanup.run();
      case MaintenanceJob.ApplicationExpiry:
        return this.applicationExpiry.run();
      case MaintenanceJob.TutorDigest:
        return this.tutorDigest.run();
      default:
        throw new Error(`Unknown maintenance job: ${job.name}`);
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<unknown, JobResult, string>): void {
    this.logger.log(
      `Job "${job.name}" (${job.id ?? '?'}) completed: ${JSON.stringify(job.returnvalue)}`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<unknown, JobResult, string> | undefined, error: Error): void {
    this.logger.error(`Job "${job?.name ?? '?'}" (${job?.id ?? '?'}) failed: ${error.message}`);
  }
}
