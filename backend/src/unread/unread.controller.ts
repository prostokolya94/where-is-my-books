import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { UnreadService } from './unread.service';
import { UpdateUnreadTargetDto } from './dto/unread.dto';

@Controller('unread')
export class UnreadController {
  constructor(private readonly service: UnreadService) {}

  @Get()
  getOverview() {
    return this.service.getOverview();
  }

  @Patch('categories/:id/target')
  setTarget(@Param('id') id: string, @Body() dto: UpdateUnreadTargetDto) {
    return this.service.setTarget(+id, dto.target ?? null);
  }
}
