import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
} from 'class-validator';

export class CreatePlanYearDto {
  @IsInt()
  year: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreatePlanRowDto {
  @IsInt()
  yearId: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  bookId?: number | null;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdatePlanRowDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  purchased?: boolean;

  @IsOptional()
  @IsInt()
  bookId?: number | null;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreatePlanSubrowDto {
  @IsInt()
  rowId: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  bookId?: number | null;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdatePlanSubrowDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  purchased?: boolean;

  @IsOptional()
  @IsInt()
  bookId?: number | null;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
