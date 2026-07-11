import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@modules/auth/decorators/public.decorator';

/** Shape returned by the liveness endpoint. */
export class HealthCheckResponse {
  status!: 'ok';
  uptime!: number;
  timestamp!: string;
}

@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  /**
   * Liveness probe for Docker/Nginx/monitoring. `@Public()` documents intent and
   * future-proofs the route against a global auth guard (none is applied today).
   */
  @Public()
  @Get()
  @ApiOkResponse({ type: HealthCheckResponse })
  check(): HealthCheckResponse {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
