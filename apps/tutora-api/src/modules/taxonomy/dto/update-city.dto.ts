import { PartialType } from '@nestjs/swagger';
import { CreateCityDto } from './create-city.dto';

/** Partial update for a city. */
export class UpdateCityDto extends PartialType(CreateCityDto) {}
