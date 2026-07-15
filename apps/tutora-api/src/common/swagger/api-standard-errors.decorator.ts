import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorDto } from './api-error.dto';

/** The error kinds an endpoint can opt into documenting, beyond the implicit 500. */
export type StandardError =
  'badRequest' | 'unauthorized' | 'forbidden' | 'notFound' | 'conflict' | 'tooManyRequests';

const DECORATORS: Record<StandardError, (description: string) => MethodDecorator & ClassDecorator> =
  {
    badRequest: (d) => ApiBadRequestResponse({ description: d, type: ApiErrorDto }),
    unauthorized: (d) => ApiUnauthorizedResponse({ description: d, type: ApiErrorDto }),
    forbidden: (d) => ApiForbiddenResponse({ description: d, type: ApiErrorDto }),
    notFound: (d) => ApiNotFoundResponse({ description: d, type: ApiErrorDto }),
    conflict: (d) => ApiConflictResponse({ description: d, type: ApiErrorDto }),
    tooManyRequests: (d) => ApiTooManyRequestsResponse({ description: d, type: ApiErrorDto }),
  };

const DESCRIPTIONS: Record<StandardError, string> = {
  badRequest: 'Validation failed or the request body/params were malformed.',
  unauthorized: 'Missing or invalid access token.',
  forbidden: 'Authenticated but not permitted to perform this action.',
  notFound: 'The requested resource does not exist.',
  conflict: 'The request conflicts with the current state of the resource.',
  tooManyRequests: 'Rate limit exceeded — retry after the throttle window.',
};

/**
 * Documents the shared {@link ApiErrorDto} envelope for the given error kinds.
 * `500 Internal Server Error` is always included because any endpoint can fail
 * unexpectedly. Applied per controller or per endpoint via `applyDecorators`, so
 * every operation advertises the same error contract without repetition.
 *
 * @example
 * ⁣@ApiStandardErrorResponses('unauthorized', 'forbidden', 'notFound')
 */
export function ApiStandardErrorResponses(
  ...errors: StandardError[]
): ReturnType<typeof applyDecorators> {
  const decorators = errors.map((error) => DECORATORS[error](DESCRIPTIONS[error]));
  return applyDecorators(
    ...decorators,
    ApiInternalServerErrorResponse({
      description: 'Unexpected server error.',
      type: ApiErrorDto,
    }),
  );
}
