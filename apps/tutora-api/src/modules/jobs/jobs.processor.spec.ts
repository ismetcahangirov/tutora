import type { Job } from 'bullmq';
import type { ApplicationExpiryService } from './handlers/application-expiry.service';
import type { CleanupService } from './handlers/cleanup.service';
import type { TutorDigestService } from './handlers/tutor-digest.service';
import { JobsProcessor } from './jobs.processor';
import { MaintenanceJob, type JobResult } from './jobs.types';

function job(name: string): Job<unknown, JobResult, string> {
  return { name, id: '1', returnvalue: undefined } as unknown as Job<unknown, JobResult, string>;
}

function build() {
  const cleanup = {
    run: jest.fn().mockResolvedValue({ refreshTokens: 1, deviceTokens: 0, notifications: 0 }),
  };
  const applicationExpiry = { run: jest.fn().mockResolvedValue({ expired: 2 }) };
  const tutorDigest = { run: jest.fn().mockResolvedValue({ tutorsNotified: 3, applications: 4 }) };
  const processor = new JobsProcessor(
    cleanup as unknown as CleanupService,
    applicationExpiry as unknown as ApplicationExpiryService,
    tutorDigest as unknown as TutorDigestService,
  );
  return { processor, cleanup, applicationExpiry, tutorDigest };
}

describe('JobsProcessor', () => {
  it('routes the cleanup job to CleanupService', async () => {
    const { processor, cleanup, applicationExpiry, tutorDigest } = build();

    await expect(processor.process(job(MaintenanceJob.Cleanup))).resolves.toEqual({
      refreshTokens: 1,
      deviceTokens: 0,
      notifications: 0,
    });
    expect(cleanup.run).toHaveBeenCalledTimes(1);
    expect(applicationExpiry.run).not.toHaveBeenCalled();
    expect(tutorDigest.run).not.toHaveBeenCalled();
  });

  it('routes the application-expiry job to ApplicationExpiryService', async () => {
    const { processor, applicationExpiry } = build();

    await expect(processor.process(job(MaintenanceJob.ApplicationExpiry))).resolves.toEqual({
      expired: 2,
    });
    expect(applicationExpiry.run).toHaveBeenCalledTimes(1);
  });

  it('routes the tutor-digest job to TutorDigestService', async () => {
    const { processor, tutorDigest } = build();

    await expect(processor.process(job(MaintenanceJob.TutorDigest))).resolves.toEqual({
      tutorsNotified: 3,
      applications: 4,
    });
    expect(tutorDigest.run).toHaveBeenCalledTimes(1);
  });

  it('throws on an unknown job name', async () => {
    const { processor } = build();

    await expect(processor.process(job('mystery'))).rejects.toThrow(
      'Unknown maintenance job: mystery',
    );
  });
});
