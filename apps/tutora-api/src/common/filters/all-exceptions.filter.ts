import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/** The project's standard error envelope (see CLAUDE.md → Error Handling). */
interface ErrorEnvelope {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

/** Converts an HttpStatus code to a PascalCase name, e.g. 400 -> "BadRequest". */
function errorNameFromStatus(status: number): string {
  const key = HttpStatus[status];
  if (!key) return 'Error';
  return key
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Catch-all exception filter. Localized validation errors are handled by the more
 * specific `I18nValidationExceptionFilter` (registered before this one), so they
 * never reach here. Everything else is shaped into the standard envelope; unknown
 * (non-HTTP) errors become a safe 500 and are logged with context — internals are
 * never leaked to the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      error = errorNameFromStatus(status);
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const shaped = body as { message?: string | string[] };
        message = shaped.message ?? exception.message;
        // We intentionally do NOT read shaped.error — our errorNameFromStatus
        // always produces the canonical PascalCase name (e.g. "NotFound").
      }
    } else {
      // Unknown error: log the real cause, return a generic message.
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.originalUrl}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const envelope: ErrorEnvelope = {
      statusCode: status,
      error,
      message,
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    };
    response.status(status).json(envelope);
  }
}
