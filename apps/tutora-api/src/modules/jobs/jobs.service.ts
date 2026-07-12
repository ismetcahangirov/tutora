import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JOB_SCHEDULES, MAINTENANCE_QUEUE } from './jobs.constants';
import type { EnqueuedJobView, JobScheduleView, MaintenanceJob } from './jobs.types';

/**
 * Owns every interaction with the maintenance queue (#38).
 *
 * On boot it (idempotently) registers a BullMQ job scheduler per entry in
 * {@link JOB_SCHEDULES}, giving the app a distributed cron: a job fires once per
 * interval across the whole fleet, survives restarts, and needs no in-process
 * timer. It also exposes on-demand enqueue for the admin/ops surface.
 */
@Injectable()
export class JobsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(JobsService.name);

  constructor(@InjectQueue(MAINTENANCE_QUEUE) private readonly queue: Queue) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.registerSchedules();
  }

  /** Upserts every cron scheduler; safe to call repeatedly (per-id idempotent). */
  async registerSchedules(): Promise<void> {
    for (const schedule of JOB_SCHEDULES) {
      await this.queue.upsertJobScheduler(
        schedule.schedulerId,
        { pattern: schedule.pattern },
        { name: schedule.job },
      );
    }
    this.logger.log(`Registered ${JOB_SCHEDULES.length} maintenance job schedulers`);
  }

  /** Enqueues a job to run as soon as a worker is free (admin/ops trigger). */
  async enqueue(job: MaintenanceJob): Promise<EnqueuedJobView> {
    const added = await this.queue.add(job, {});
    return { id: added.id ?? null, job };
  }

  /** The configured jobs and their cron patterns (read-only view). */
  listSchedules(): JobScheduleView[] {
    return JOB_SCHEDULES.map(({ job, pattern }) => ({ job, pattern }));
  }
}
