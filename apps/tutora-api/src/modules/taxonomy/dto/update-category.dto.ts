import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

/** Partial update for a category — every field from create becomes optional. */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
