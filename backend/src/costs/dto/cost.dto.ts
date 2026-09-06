import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { BookStatus } from '../../common/book-status.enum';

export class CreateCostAccountDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  categories?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  genres?: number[];

  @IsOptional()
  @IsArray()
  @IsEnum(BookStatus, { each: true })
  statuses?: BookStatus[];

  @IsOptional()
  @IsInt()
  purchaseYearFrom?: number | null;

  @IsOptional()
  @IsInt()
  purchaseYearTo?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

export class UpdateCostAccountDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  categories?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  genres?: number[];

  @IsOptional()
  @IsArray()
  @IsEnum(BookStatus, { each: true })
  statuses?: BookStatus[];

  @IsOptional()
  @IsInt()
  purchaseYearFrom?: number | null;

  @IsOptional()
  @IsInt()
  purchaseYearTo?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}