import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from '../books/book.entity';
import { CostAccount } from './cost-account.entity';
import { CostsService } from './costs.service';
import { CostsController } from './costs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CostAccount, Book])],
  controllers: [CostsController],
  providers: [CostsService],
})
export class CostsModule {}