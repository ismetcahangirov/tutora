import { Global, Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { AdminNotificationsController } from './admin-notifications.controller';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';

/**
 * Push (Firebase) + in-app notifications with segmentation (#35).
 *
 * `@Global()` and exports `NotificationsService` so any feature can raise
 * notifications (`notifyUser` / `broadcast`) without importing this module —
 * mirroring `MailModule`. Imports `AuthModule` for the route guards.
 */
@Global()
@Module({
  imports: [AuthModule],
  controllers: [NotificationsController, AdminNotificationsController],
  providers: [NotificationsService, PushService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
