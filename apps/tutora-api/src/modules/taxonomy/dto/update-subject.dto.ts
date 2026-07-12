import { PartialType } from '@nestjs/swagger';
import { CreateSubjectDto } from './create-subject.dto';

/** Partial update for a subject. */
export class UpdateSubjectDto extends PartialType(CreateSubjectDto) {}
