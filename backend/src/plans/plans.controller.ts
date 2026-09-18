import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PlansService } from './plans.service';
import {
  CreatePlanYearDto,
  CreatePlanRowDto,
  UpdatePlanRowDto,
  CreatePlanSubrowDto,
  UpdatePlanSubrowDto,
} from './dto/plan.dto';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { Track } from '../events/event-track.decorator';

@Controller('plans')
export class PlansController {
  constructor(private readonly service: PlansService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.id);
  }

  @Post('years')
  @Track('plan.year.create')
  createYear(@Body() dto: CreatePlanYearDto, @CurrentUser() user: AuthUser) {
    return this.service.createYear(dto, user.id);
  }

  @Delete('years/:id')
  @Track('plan.year.delete')
  removeYear(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.removeYear(+id, user.id);
  }

  @Post('rows')
  @Track('plan.row.create')
  createRow(@Body() dto: CreatePlanRowDto, @CurrentUser() user: AuthUser) {
    return this.service.createRow(dto, user.id);
  }

  @Patch('rows/:id')
  @Track('plan.row.update')
  updateRow(@Param('id') id: string, @Body() dto: UpdatePlanRowDto, @CurrentUser() user: AuthUser) {
    return this.service.updateRow(+id, dto, user.id);
  }

  @Delete('rows/:id')
  @Track('plan.row.delete')
  removeRow(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.removeRow(+id, user.id);
  }

  @Post('subrows')
  @Track('plan.subrow.create')
  createSubrow(@Body() dto: CreatePlanSubrowDto, @CurrentUser() user: AuthUser) {
    return this.service.createSubrow(dto, user.id);
  }

  @Patch('subrows/:id')
  @Track('plan.subrow.update')
  updateSubrow(@Param('id') id: string, @Body() dto: UpdatePlanSubrowDto, @CurrentUser() user: AuthUser) {
    return this.service.updateSubrow(+id, dto, user.id);
  }

  @Delete('subrows/:id')
  @Track('plan.subrow.delete')
  removeSubrow(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.removeSubrow(+id, user.id);
  }
}