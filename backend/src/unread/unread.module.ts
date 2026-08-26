import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from '../books/book.entity';
import { Category } from '../categories/category.entity';
import { Genre } from '../genres/genre.entity';
import { UnreadSnapshot } from './unread-snapshot.entity';
import { UnreadGenreTarget } from './unread-genre-target.entity';
import { UnreadService } from './unread.service';
import { UnreadController } from './unread.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Book,
      Category,
      Genre,
      UnreadSnapshot,
      UnreadGenreTarget,
    ]),
  ],
  controllers: [UnreadController],
  providers: [UnreadService],
})
export class UnreadModule {}
