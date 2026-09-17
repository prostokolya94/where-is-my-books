import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { CostsService } from './costs.service';
import { CreateCostAccountDto, UpdateCostAccountDto } from './dto/cost.dto';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

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
  create(@Body() dto: CreateCostAccountDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCostAccountDto, @CurrentUser() user: AuthUser) {
    return this.service.update(+id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(+id, user.id);
  }
}