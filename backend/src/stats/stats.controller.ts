import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  @Get()
  getStats(@Query('status') status?: string) {
    return this.service.getStats(status);
  }
}
