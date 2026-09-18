import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BooksService, BookQuery } from './books.service';
import { CreateBookDto, UpdateBookDto } from './dto/book.dto';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { Track } from '../events/event-track.decorator';

@Controller('books')
export class BooksController {
  constructor(private readonly service: BooksService) {}

  @Get()
  findAll(
    @Query('categories') categories?: string,
    @Query('genres') genres?: string,
    @Query('statuses') statuses?: string,
    @Query('search') search?: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: AuthUser,
  ) {
    const query: BookQuery = { categories, genres, statuses, search };
    const off = Math.max(0, parseInt(offset ?? '0', 10) || 0);
    const lim = Math.min(200, Math.max(1, parseInt(limit ?? '30', 10) || 30));
    return this.service.findAll(query, off, lim, user?.id);
  }

  @Get('authors')
  findAuthors(@CurrentUser() user: AuthUser) {
    return this.service.findAuthors(user.id);
  }

  @Get('all')
  findAllRaw(@CurrentUser() user: AuthUser) {
    return this.service.findAllRaw(user.id);
  }

  @Post()
  @Track('book.create')
  create(@Body() dto: CreateBookDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Patch(':id')
  @Track('book.update')
  update(@Param('id') id: string, @Body() dto: UpdateBookDto, @CurrentUser() user: AuthUser) {
    return this.service.update(+id, dto, user.id);
  }

  @Delete(':id')
  @Track('book.delete')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(+id, user.id);
  }
}