import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { EventsService } from './events.service';
import { TrackEventDto } from './dto/track-event.dto';

const ALLOWED_CLIENT_TYPES = new Set(['page.open', 'auth.logout']);

@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Post()
  async track(
    @Body() dto: TrackEventDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{ ok: boolean }> {
    if (!ALLOWED_CLIENT_TYPES.has(dto.type)) {
      throw new BadRequestException('Неизвестный тип события');
    }
    await this.service.record(user.id, dto.type, dto.payload ?? undefined);
    return { ok: true };
  }
}