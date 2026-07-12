import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '@modules/auth/auth.module';
import { MAINTENANCE_QUEUE } from './jobs.constants';
import { redisConnectionOptions } from './jobs.connection';
import { JobsService } from './jobs.service';
import { JobsProcessor } from './jobs.processor';
import { AdminJobsController } from './admin-jobs.controller';
import { CleanupService } from './handlers/cleanup.service';
import { ApplicationExpiryService } from './handlers/application-expiry.service';
import { TutorDigestService } from './handlers/tutor-digest.service';

/**
 * BullMQ background jobs + cron scheduler (#38).
 *
 * Wires the Redis-backed maintenance queue (connection derived from `REDIS_URL`),
 * its worker ({@link JobsProcessor}), the cron scheduler + on-demand enqueue
 * ({@link JobsService}) and the job handlers. Imports `AuthModule` for the admin
 * route guards; digests reach the global `NotificationsService` and `I18nService`.
 */
@Module({
  imports: [
    AuthModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: redisConnectionOptions(config.getOrThrow<string>('REDIS_URL')),
      }),
    }),
    BullModule.registerQueue({
      name: MAINTENANCE_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 500 },
      },
    }),
  ],
  controllers: [AdminJobsController],
  providers: [
    JobsService,
    JobsProcessor,
    CleanupService,
    ApplicationExpiryService,
    TutorDigestService,
  ],
})
export class JobsModule {}
