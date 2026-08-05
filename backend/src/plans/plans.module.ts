import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchasePlanYear } from './purchase-plan-year.entity';
import { PurchasePlanRow } from './purchase-plan-row.entity';
import { PurchasePlanSubrow } from './purchase-plan-subrow.entity';
import { Book } from '../books/book.entity';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchasePlanYear,
      PurchasePlanRow,
      PurchasePlanSubrow,
      Book,
    ]),
  ],
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
