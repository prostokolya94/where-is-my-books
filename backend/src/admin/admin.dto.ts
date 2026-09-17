import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUserAdminDto {
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @IsOptional()
  @IsBoolean()
  canDownloadHisOwnDataBase?: boolean;
}