import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { CostsService } from './costs.service';
import { CreateCostAccountDto, UpdateCostAccountDto } from './dto/cost.dto';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { Track } from '../events/event-track.decorator';

@Controller('costs')
export class CostsController {
  constructor(private readonly service: CostsService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: AuthUser) {
    return this.service.getSummary(user.id);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.id);
  }

  @Post()
  @Track('cost.account.create')
  create(@Body() dto: CreateCostAccountDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Patch(':id')
  @Track('cost.account.update')
  update(@Param('id') id: string, @Body() dto: UpdateCostAccountDto, @CurrentUser() user: AuthUser) {
    return this.service.update(+id, dto, user.id);
  }

  @Delete(':id')
  @Track('cost.account.delete')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(+id, user.id);
  }
}