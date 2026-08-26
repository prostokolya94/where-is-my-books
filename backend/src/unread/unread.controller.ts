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

  @Patch('genres/:id/target')
  setGenreTarget(@Param('id') id: string, @Body() dto: UpdateUnreadTargetDto) {
    return this.service.setGenreTarget(+id, dto.target ?? null);
  }
}
