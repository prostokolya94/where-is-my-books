import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsNumber,
  Min,
} from 'class-validator';
import { TabFilters } from '../tab.entity';

export class CreateTabDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsObject()
  filters?: TabFilters;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

export class UpdateTabDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsObject()
  filters?: TabFilters;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}
