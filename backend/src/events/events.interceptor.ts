import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { TRACK_KEY } from './event-track.decorator';
import { AuthUser } from '../auth/current-user.decorator';
import { EventsService } from './events.service';

@Injectable()
export class EventTrackingInterceptor implements NestInterceptor {
  constructor(
    private readonly events: EventsService,
    private readonly reflector: Reflector,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const type = this.reflector.get<string>(TRACK_KEY, context.getHandler());
    if (!type) return next.handle();

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;

    return next.handle().pipe(
      tap(() => {
        if (user?.id) {
          this.events.record(user.id, type, { path: request.path });
        }
      }),
    );
  }
}