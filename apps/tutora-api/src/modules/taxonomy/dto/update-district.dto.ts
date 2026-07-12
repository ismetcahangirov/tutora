import { PartialType } from '@nestjs/swagger';
import { CreateDistrictDto } from './create-district.dto';

/** Partial update for a district. */
export class UpdateDistrictDto extends PartialType(CreateDistrictDto) {}
