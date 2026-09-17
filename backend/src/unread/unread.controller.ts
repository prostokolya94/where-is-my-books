import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { UnreadService } from './unread.service';
import { UpdateUnreadTargetDto } from './dto/unread.dto';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@Controller('unread')
export class UnreadController {
  constructor(private readonly service: UnreadService) {}

  @Get()
  getOverview(@CurrentUser() user: AuthUser) {
    return this.service.getOverview(user.id);
  }

  @Patch('genres/:id/target')
  setGenreTarget(
    @Param('id') id: string,
    @Body() dto: UpdateUnreadTargetDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.setGenreTarget(+id, dto.target ?? null, user.id);
  }
}