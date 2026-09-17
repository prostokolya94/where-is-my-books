import { Controller, Get } from '@nestjs/common';
import { StatsService } from './stats.service';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@Controller('stats')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  @Get()
  getStats(@CurrentUser() user: AuthUser) {
    return this.service.getStats(user.id);
  }
}