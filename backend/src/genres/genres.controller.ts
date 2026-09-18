import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GenresService } from './genres.service';
import { CreateGenreDto, UpdateGenreDto, ReorderDto } from './dto/genre.dto';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { Track } from '../events/event-track.decorator';

@Controller('genres')
export class GenresController {
  constructor(private readonly service: GenresService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.id);
  }

  @Post()
  @Track('genre.create')
  create(@Body() dto: CreateGenreDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Patch('reorder')
  @Track('genre.reorder')
  reorder(@Body() dto: ReorderDto, @CurrentUser() user: AuthUser) {
    return this.service.reorder(dto.ids, user.id);
  }

  @Patch(':id')
  @Track('genre.update')
  update(@Param('id') id: string, @Body() dto: UpdateGenreDto, @CurrentUser() user: AuthUser) {
    return this.service.update(+id, dto, user.id);
  }

  @Delete(':id')
  @Track('genre.delete')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(+id, user.id);
  }
}