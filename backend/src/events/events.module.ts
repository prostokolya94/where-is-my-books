import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEvent } from './user-event.entity';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventTrackingInterceptor } from './events.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([UserEvent])],
  controllers: [EventsController],
  providers: [
    EventsService,
    EventTrackingInterceptor,
    { provide: APP_INTERCEPTOR, useClass: EventTrackingInterceptor },
  ],
  exports: [EventsService],
})
export class EventsModule {}