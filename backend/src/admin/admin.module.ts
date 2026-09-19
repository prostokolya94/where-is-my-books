import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/user.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminGuard } from './admin.guard';
import { EventsModule } from '../events/events.module';
import { FlagsModule } from '../flags/flags.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), EventsModule, FlagsModule],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}