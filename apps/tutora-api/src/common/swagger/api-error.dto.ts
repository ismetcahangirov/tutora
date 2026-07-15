import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard error envelope produced by the global exception filter
 * (see CLAUDE.md → Error Handling and `AllExceptionsFilter`). Documented once
 * here and reused across every endpoint via {@link ApiStandardErrorResponses},
 * so the API advertises a single, consistent error shape.
 */
export class ApiErrorDto {
  @ApiProperty({ example: 400, description: 'HTTP status code.' })
  statusCode!: number;

  @ApiProperty({
    example: 'BadRequest',
    description: 'PascalCase error name derived from the status code.',
  })
  error!: string;

  @ApiProperty({
    description: 'Human-readable message, or an array of field messages for validation errors.',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Validation failed',
  })
  message!: string | string[];

  @ApiProperty({
    example: '/api/v1/tutors',
    description: 'Request path that produced the error.',
  })
  path!: string;

  @ApiProperty({
    format: 'date-time',
    example: '2026-07-15T10:30:00.000Z',
    description: 'ISO-8601 timestamp of the failure.',
  })
  timestamp!: string;
}
