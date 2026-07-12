import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { AdminTutorsController } from './admin-tutors.controller';
import { AdminTutorsService } from './admin-tutors.service';
import { TutorPublicController } from './tutor-public.controller';
import { TutorRelationsService } from './tutor-relations.service';
import { TutorsController } from './tutors.controller';
import { TutorsService } from './tutors.service';

@Module({
  imports: [AuthModule],
  // TutorsController (self, literal `me` routes) is registered before
  // TutorPublicController so `/tutors/me` resolves ahead of `/tutors/:id`.
  controllers: [TutorsController, TutorPublicController, AdminTutorsController],
  providers: [TutorsService, TutorRelationsService, AdminTutorsService],
  exports: [TutorsService],
})
export class TutorsModule {}
