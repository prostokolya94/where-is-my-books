import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService, AdminUserView } from './admin.service';
import { AdminGuard } from './admin.guard';
import { UpdateUserAdminDto } from './admin.dto';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { EventsService, EventSummaryRow } from '../events/events.service';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly service: AdminService,
    private readonly events: EventsService,
  ) {}

  @Get('users')
  list(): Promise<AdminUserView[]> {
    return this.service.list();
  }

  @Patch('users/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserAdminDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<AdminUserView> {
    return this.service.update(id, dto, actor.id);
  }

  @Get('events/summary')
  eventsSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('userId') userId?: string,
  ): Promise<EventSummaryRow[]> {
    return this.events.summary({
      from,
      to,
      userId: this.parseUserId(userId),
    });
  }

  @Get('events/breakdown')
  eventsBreakdown(
    @Query('type') type: string,
    @Query('key') key?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('userId') userId?: string,
  ): Promise<EventSummaryRow[]> {
    return this.events.breakdown({
      type,
      key,
      from,
      to,
      userId: this.parseUserId(userId),
    });
  }

  private parseUserId(userId?: string): number | undefined {
    if (!userId) return undefined;
    const parsed = Number(userId);
    return !isNaN(parsed) ? parsed : undefined;
  }
}