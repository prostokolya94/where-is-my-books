import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { CostsService } from './costs.service';
import { CreateCostAccountDto, UpdateCostAccountDto } from './dto/cost.dto';

@Controller('costs')
export class CostsController {
  constructor(private readonly service: CostsService) {}

  @Get('summary')
  getSummary() {
    return this.service.getSummary();
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateCostAccountDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCostAccountDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}