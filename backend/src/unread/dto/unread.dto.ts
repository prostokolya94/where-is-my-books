import { IsInt, IsOptional } from 'class-validator';

export class UpdateUnreadTargetDto {
  @IsOptional()
  @IsInt()
  target?: number | null;
}
