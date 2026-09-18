import { SetMetadata } from '@nestjs/common';

export const TRACK_KEY = 'event:track';

export const Track = (type: string) => SetMetadata(TRACK_KEY, type);