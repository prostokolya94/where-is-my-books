import { Controller, Get } from '@nestjs/common';
import { ReadService } from './read.service';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@Controller('read')
export class ReadController {
  constructor(private readonly service: ReadService) {}

  @Get()
  getOverview(@CurrentUser() user: AuthUser) {
    return this.service.getOverview(user.id);
  }
}
