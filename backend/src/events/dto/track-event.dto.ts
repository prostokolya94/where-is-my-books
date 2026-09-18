import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class TrackEventDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}