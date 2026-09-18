import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  ReorderDto,
} from './dto/category.dto';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { Track } from '../events/event-track.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.id);
  }

  @Post()
  @Track('category.create')
  create(@Body() dto: CreateCategoryDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Patch('reorder')
  @Track('category.reorder')
  reorder(@Body() dto: ReorderDto, @CurrentUser() user: AuthUser) {
    return this.service.reorder(dto.ids, user.id);
  }

  @Patch(':id')
  @Track('category.update')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto, @CurrentUser() user: AuthUser) {
    return this.service.update(+id, dto, user.id);
  }

  @Delete(':id')
  @Track('category.delete')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(+id, user.id);
  }
}