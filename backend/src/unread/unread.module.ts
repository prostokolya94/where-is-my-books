import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from '../books/book.entity';
import { Category } from '../categories/category.entity';
import { Genre } from '../genres/genre.entity';
import { UnreadSnapshot } from './unread-snapshot.entity';
import { UnreadCategoryTarget } from './unread-category-target.entity';
import { UnreadService } from './unread.service';
import { UnreadController } from './unread.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Book,
      Category,
      Genre,
      UnreadSnapshot,
      UnreadCategoryTarget,
    ]),
  ],
  controllers: [UnreadController],
  providers: [UnreadService],
})
export class UnreadModule {}
