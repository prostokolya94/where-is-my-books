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
  ) {
    const query: BookQuery = { categories, genres, statuses, search };
    const off = Math.max(0, parseInt(offset ?? '0', 10) || 0);
    const lim = Math.min(200, Math.max(1, parseInt(limit ?? '30', 10) || 30));
    return this.service.findAll(query, off, lim);
  }

  @Get('all')
  findAllRaw() {
    return this.service.findAllRaw();
  }

  @Post()
  create(@Body() dto: CreateBookDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBookDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
