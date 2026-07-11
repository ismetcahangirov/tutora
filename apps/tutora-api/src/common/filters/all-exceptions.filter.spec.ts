import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

interface CapturedResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

function createHost(url = '/api/v1/tutors/x'): {
  host: ArgumentsHost;
  getBody: () => CapturedResponse;
  getStatus: () => number;
} {
  let body!: CapturedResponse;
  let status!: number;
  const res = {
    status: (code: number) => {
      status = code;
      return res;
    },
    json: (payload: CapturedResponse) => {
      body = payload;
      return res;
    },
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => res,
      getRequest: () => ({ originalUrl: url }),
    }),
  } as unknown as ArgumentsHost;
  return { host, getBody: () => body, getStatus: () => status };
}

describe('AllExceptionsFilter', () => {
  it('maps an HttpException to the standard envelope', () => {
    const { host, getBody, getStatus } = createHost();
    new AllExceptionsFilter().catch(new NotFoundException('Tutor not found'), host);

    expect(getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(getBody()).toMatchObject({
      statusCode: 404,
      error: 'NotFound',
      message: 'Tutor not found',
      path: '/api/v1/tutors/x',
    });
    expect(typeof getBody().timestamp).toBe('string');
  });

  it('maps an unknown error to a safe 500 without leaking internals', () => {
    const { host, getBody, getStatus } = createHost('/api/v1/health');
    const logSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    new AllExceptionsFilter().catch(new Error('db connection string leaked'), host);

    expect(getStatus()).toBe(500);
    expect(getBody()).toMatchObject({
      statusCode: 500,
      error: 'InternalServerError',
      message: 'Internal server error',
      path: '/api/v1/health',
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('derives the error name from an HttpException status', () => {
    const { host, getBody } = createHost();
    new AllExceptionsFilter().catch(new HttpException('Nope', HttpStatus.BAD_REQUEST), host);
    expect(getBody().error).toBe('BadRequest');
  });
});
