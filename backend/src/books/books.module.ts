import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from './book.entity';
import { PurchasePlanRow } from '../plans/purchase-plan-row.entity';
import { PurchasePlanSubrow } from '../plans/purchase-plan-subrow.entity';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book, PurchasePlanRow, PurchasePlanSubrow]),
  ],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
