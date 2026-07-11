import { type ArgumentsHost, HttpStatus } from '@nestjs/common';
import type { Request } from 'express';
import { type I18nValidationException, I18nValidationExceptionFilter } from 'nestjs-i18n';

/**
 * Builds the global filter for localized validation failures. `nestjs-i18n`
 * translates each message to the resolved request language before this runs; we
 * only reshape the payload into the project's standard error envelope
 * (see CLAUDE.md → Error Handling).
 */
export function createI18nValidationExceptionFilter(): I18nValidationExceptionFilter {
  return new I18nValidationExceptionFilter({
    responseBodyFormatter: (
      host: ArgumentsHost,
      _exception: I18nValidationException,
      formattedErrors: object,
    ): Record<string, unknown> => {
      const request = host.switchToHttp().getRequest<Request>();
      const messages = formattedErrors as string[];
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'BadRequest',
        message: messages.length === 1 ? messages[0] : messages,
        path: request.originalUrl,
        timestamp: new Date().toISOString(),
      };
    },
  });
}
