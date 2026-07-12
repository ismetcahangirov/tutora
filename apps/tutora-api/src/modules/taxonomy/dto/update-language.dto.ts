import { PartialType } from '@nestjs/swagger';
import { CreateLanguageDto } from './create-language.dto';

/** Partial update for a language. */
export class UpdateLanguageDto extends PartialType(CreateLanguageDto) {}
