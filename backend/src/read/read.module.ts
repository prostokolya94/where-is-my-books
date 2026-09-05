import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from '../books/book.entity';
import { Category } from '../categories/category.entity';
import { Genre } from '../genres/genre.entity';
import { ReadService } from './read.service';
import { ReadController } from './read.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Book, Category, Genre])],
  controllers: [ReadController],
  providers: [ReadService],
})
export class ReadModule {}
