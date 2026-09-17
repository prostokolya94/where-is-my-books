import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDump } from './user-dump.entity';
import { DumpsService } from './dumps.service';
import { DumpsController } from './dumps.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserDump])],
  controllers: [DumpsController],
  providers: [DumpsService],
})
export class DumpsModule {}