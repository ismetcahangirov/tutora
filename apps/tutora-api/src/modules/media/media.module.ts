import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { StorageService } from './storage.service';

/**
 * Signed uploads to Cloud Storage for avatars and certificates (#37).
 *
 * Imports `AuthModule` for the route guards. `StorageService` is the GCS transport
 * (kept separate from `MediaService`'s policy so it can be mocked in tests exactly
 * like the push transport). Not exported — uploads are a client-facing flow, not
 * something other modules invoke.
 */
@Module({
  imports: [AuthModule],
  controllers: [MediaController],
  providers: [MediaService, StorageService],
})
export class MediaModule {}
