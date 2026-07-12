import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { AdminStudentsController } from './admin-students.controller';
import { AdminStudentsService } from './admin-students.service';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  imports: [AuthModule],
  controllers: [StudentsController, AdminStudentsController],
  providers: [StudentsService, AdminStudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
