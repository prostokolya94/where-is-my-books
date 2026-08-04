import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from '../books/book.entity';
import { Category } from '../categories/category.entity';
import { Genre } from '../genres/genre.entity';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Book, Category, Genre])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
