import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TabsService } from './tabs.service';
import { CreateTabDto, UpdateTabDto } from './dto/tab.dto';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { Track } from '../events/event-track.decorator';

@Controller('tabs')
export class TabsController {
  constructor(private readonly service: TabsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.findOne(+id, user.id);
  }

  @Post()
  @Track('tab.create')
  create(@Body() dto: CreateTabDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Patch(':id')
  @Track('tab.update')
  update(@Param('id') id: string, @Body() dto: UpdateTabDto, @CurrentUser() user: AuthUser) {
    return this.service.update(+id, dto, user.id);
  }

  @Delete(':id')
  @Track('tab.delete')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(+id, user.id);
  }
}