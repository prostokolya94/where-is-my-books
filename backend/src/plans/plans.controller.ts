import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PlansService } from './plans.service';
import {
  CreatePlanYearDto,
  CreatePlanRowDto,
  UpdatePlanRowDto,
  CreatePlanSubrowDto,
  UpdatePlanSubrowDto,
} from './dto/plan.dto';

@Controller('plans')
export class PlansController {
  constructor(private readonly service: PlansService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post('years')
  createYear(@Body() dto: CreatePlanYearDto) {
    return this.service.createYear(dto);
  }

  @Delete('years/:id')
  removeYear(@Param('id') id: string) {
    return this.service.removeYear(+id);
  }

  @Post('rows')
  createRow(@Body() dto: CreatePlanRowDto) {
    return this.service.createRow(dto);
  }

  @Patch('rows/:id')
  updateRow(@Param('id') id: string, @Body() dto: UpdatePlanRowDto) {
    return this.service.updateRow(+id, dto);
  }

  @Delete('rows/:id')
  removeRow(@Param('id') id: string) {
    return this.service.removeRow(+id);
  }

  @Post('subrows')
  createSubrow(@Body() dto: CreatePlanSubrowDto) {
    return this.service.createSubrow(dto);
  }

  @Patch('subrows/:id')
  updateSubrow(@Param('id') id: string, @Body() dto: UpdatePlanSubrowDto) {
    return this.service.updateSubrow(+id, dto);
  }

  @Delete('subrows/:id')
  removeSubrow(@Param('id') id: string) {
    return this.service.removeSubrow(+id);
  }
}
