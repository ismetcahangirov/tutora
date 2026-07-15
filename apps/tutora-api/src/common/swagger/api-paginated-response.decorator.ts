import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PageMetaDto } from './page-meta.dto';

/**
 * Documents the standard `{ data: Model[]; meta: PageMeta }` paginated envelope
 * for `model`. Both the item model and {@link PageMetaDto} are registered as
 * extra models so the generated schema references them by `$ref` rather than
 * inlining a copy per endpoint.
 */
export function ApiPaginatedResponse<TModel extends Type<unknown>>(
  model: TModel,
  options: { description?: string } = {},
): ReturnType<typeof applyDecorators> {
  return applyDecorators(
    ApiExtraModels(PageMetaDto, model),
    ApiOkResponse({
      description: options.description ?? `Paginated list of ${model.name}.`,
      schema: {
        type: 'object',
        required: ['data', 'meta'],
        properties: {
          data: { type: 'array', items: { $ref: getSchemaPath(model) } },
          meta: { $ref: getSchemaPath(PageMetaDto) },
        },
      },
    }),
  );
}
