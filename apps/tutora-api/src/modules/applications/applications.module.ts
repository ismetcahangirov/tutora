import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { TutorApplicationsController } from './tutor-applications.controller';

/** Student→tutor applications with a status lifecycle (#32). */
@Module({
  imports: [AuthModule],
  controllers: [ApplicationsController, TutorApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
