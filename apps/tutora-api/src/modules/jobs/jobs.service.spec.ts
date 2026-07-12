import type { Queue } from 'bullmq';
import { JOB_SCHEDULES } from './jobs.constants';
import { JobsService } from './jobs.service';
import { MaintenanceJob } from './jobs.types';

function build() {
  const queue = {
    upsertJobScheduler: jest.fn().mockResolvedValue(undefined),
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
  };
  const service = new JobsService(queue as unknown as Queue);
  return { service, queue };
}

describe('JobsService', () => {
  it('registers a scheduler per configured job on bootstrap', async () => {
    const { service, queue } = build();

    await service.onApplicationBootstrap();

    expect(queue.upsertJobScheduler).toHaveBeenCalledTimes(JOB_SCHEDULES.length);
    for (const schedule of JOB_SCHEDULES) {
      expect(queue.upsertJobScheduler).toHaveBeenCalledWith(
        schedule.schedulerId,
        { pattern: schedule.pattern },
        { name: schedule.job },
      );
    }
  });

  it('enqueues a job on demand and returns its id', async () => {
    const { service, queue } = build();

    await expect(service.enqueue(MaintenanceJob.Cleanup)).resolves.toEqual({
      id: 'job-1',
      job: MaintenanceJob.Cleanup,
    });
    expect(queue.add).toHaveBeenCalledWith(MaintenanceJob.Cleanup, {});
  });

  it('returns a null id when BullMQ does not assign one', async () => {
    const { service, queue } = build();
    queue.add.mockResolvedValueOnce({ id: undefined });

    await expect(service.enqueue(MaintenanceJob.TutorDigest)).resolves.toEqual({
      id: null,
      job: MaintenanceJob.TutorDigest,
    });
  });

  it('lists every schedule with its cron pattern', () => {
    const { service } = build();

    expect(service.listSchedules()).toEqual(
      JOB_SCHEDULES.map(({ job, pattern }) => ({ job, pattern })),
    );
  });
});
