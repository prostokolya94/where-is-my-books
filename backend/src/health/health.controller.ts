import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return {
      ok: true,
      uptime: Math.round(process.uptime()),
      now: new Date().toISOString(),
    };
  }
}