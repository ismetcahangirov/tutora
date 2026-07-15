import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '@modules/auth/decorators/public.decorator';

/** Shape returned by the liveness endpoint. */
export class HealthCheckResponse {
  @ApiProperty({
    description: 'Liveness marker; always `ok` when the service responds.',
    example: 'ok',
  })
  status!: 'ok';

  @ApiProperty({ description: 'Process uptime in seconds.', example: 1234.56 })
  uptime!: number;

  @ApiProperty({ type: String, format: 'date-time', description: 'When the check ran (ISO 8601).' })
  timestamp!: string;
}

// Liveness probes are polled frequently by Docker/monitoring — exempt from rate
// limiting so an aggressive probe interval never trips the limiter.
@SkipThrottle()
@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  /**
   * Liveness probe for Docker/Nginx/monitoring. `@Public()` documents intent and
   * future-proofs the route against a global auth guard (none is applied today).
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({ description: 'Service is healthy.', type: HealthCheckResponse })
  check(): HealthCheckResponse {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
